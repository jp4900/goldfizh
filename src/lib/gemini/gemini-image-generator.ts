import "server-only";
import { GoogleGenAI, type Part } from "@google/genai";
import { getServerEnv } from "@/lib/env";
import type { BrandAssetWithBytes, ImagePromptSpec } from "@/lib/studio/types";

export type ImageGenerationResult = {
  bytes: Uint8Array;
  mimeType: string;
};

export type ImageGenerationErrorCode =
  | "rate_limited"
  | "safety_blocked"
  | "timeout"
  | "provider_error";

export class ImageGenerationError extends Error {
  readonly code: ImageGenerationErrorCode;

  constructor(code: ImageGenerationErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

function toBase64(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("base64");
}

function mapProviderError(error: unknown): ImageGenerationError {
  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();
  const status =
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    typeof (error as { status: unknown }).status === "number"
      ? (error as { status: number }).status
      : undefined;
  if (status === 429 || lower.includes("429") || lower.includes("quota")) {
    return new ImageGenerationError("rate_limited", message);
  }
  if (lower.includes("safety") || lower.includes("blocked")) {
    return new ImageGenerationError("safety_blocked", message);
  }
  if (lower.includes("timeout") || lower.includes("aborted")) {
    return new ImageGenerationError("timeout", message);
  }
  return new ImageGenerationError("provider_error", message);
}

function buildParts(
  spec: ImagePromptSpec,
  referenceAssets: BrandAssetWithBytes[],
): Part[] {
  const parts: Part[] = [{ text: spec.prompt }];
  for (const asset of referenceAssets) {
    parts.push({
      inlineData: {
        mimeType: asset.mimeType,
        data: toBase64(asset.bytes),
      },
    });
  }
  return parts;
}

export function createGeminiImageGenerator() {
  const env = getServerEnv();
  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new ImageGenerationError(
      "provider_error",
      "GEMINI_API_KEY is not configured",
    );
  }
  const client = new GoogleGenAI({ apiKey });

  return {
    async generate(
      spec: ImagePromptSpec,
      referenceAssets: BrandAssetWithBytes[],
      signal: AbortSignal,
    ): Promise<ImageGenerationResult> {
      if (signal.aborted) {
        throw new ImageGenerationError("timeout", "Generation aborted");
      }

      try {
        const response = await client.models.generateContent({
          model: spec.model,
          contents: [{ role: "user", parts: buildParts(spec, referenceAssets) }],
          config: {
            responseModalities: ["IMAGE"],
            imageConfig: {
              aspectRatio: spec.aspectRatio,
              imageSize: spec.imageSize,
            },
            abortSignal: signal,
          },
        });

        const parts = response.candidates?.[0]?.content?.parts ?? [];
        for (const part of parts) {
          const data = part.inlineData?.data;
          if (data) {
            return {
              bytes: Uint8Array.from(Buffer.from(data, "base64")),
              mimeType: part.inlineData?.mimeType ?? "image/png",
            };
          }
        }

        throw new ImageGenerationError("provider_error", "No image in model response");
      } catch (error) {
        if (error instanceof ImageGenerationError) {
          throw error;
        }
        throw mapProviderError(error);
      }
    },
  };
}
