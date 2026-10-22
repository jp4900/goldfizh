"use server";

import { refresh } from "next/cache";
import { getServerEnv } from "@/lib/env";
import { getSession } from "@/lib/session";
import { composePrompt } from "@/lib/studio/compose-prompt";
import { parseGenerationRequest } from "@/app/studio/request-schema";
import {
  assertWithinQuota,
  createPendingGeneration,
  loadGenerationContext,
  markGenerationFailed,
  markGenerationSucceeded,
  QuotaExceededError,
  uploadGenerationImage,
} from "@/lib/studio/data";
import {
  createGeminiImageGenerator,
  ImageGenerationError,
} from "@/lib/gemini/gemini-image-generator";
import { generatePollinationsImage } from "@/lib/pollinations/image-generator";
import type { GenerationDTO, GenerationRequest } from "@/lib/studio/types";

export type GenerateImageState =
  | { status: "idle" }
  | { status: "invalid"; fieldErrors: Record<string, string> }
  | { status: "failed"; code: string; message: string }
  | { status: "succeeded"; generation: GenerationDTO };

export async function generateImageAction(
  _prev: GenerateImageState,
  formData: FormData,
): Promise<GenerateImageState> {
  const session = await getSession();
  const context = await loadGenerationContext(session.tenantId);
  const allowedPages = context.brand.contentPages.map((page) => page.url);
  const allowedSegments = context.brand.segments;
  const parsed = parseGenerationRequest(formData, allowedPages, allowedSegments);
  if (!parsed.ok) {
    return {
      status: "invalid",
      fieldErrors: parsed.fieldErrors,
    };
  }

  const provider = parsed.data.provider;
  const request: GenerationRequest = {
    pageUrl: parsed.data.pageUrl,
    brandSegment: parsed.data.brandSegment,
    style: parsed.data.style,
    styleOther: parsed.data.styleOther ?? null,
    colors: parsed.data.colors,
    colorsOther: parsed.data.colorsOther ?? null,
    mainColorHex: parsed.data.mainColorHex,
    format: parsed.data.format,
  };

  try {
    await assertWithinQuota(session.tenantId);
  } catch (error) {
    if (error instanceof QuotaExceededError) {
      return {
        status: "failed",
        code: error.code,
        message: "Hourly generation limit reached for this client.",
      };
    }
    throw error;
  }

  const env = getServerEnv();
  const modelLabel =
    provider === "gemini" ? env.GEMINI_IMAGE_MODEL : "pollinations";
  const spec = composePrompt(
    context.vision,
    context.brand,
    context.referenceAssets,
    request,
    modelLabel,
  );

  const generationId = await createPendingGeneration(session, spec);
  const started = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 55_000);

  try {
    const result =
      provider === "gemini"
        ? await createGeminiImageGenerator().generate(
            spec,
            context.referenceAssets,
            controller.signal,
          )
        : await generatePollinationsImage(
            spec.prompt,
            spec.aspectRatio,
            controller.signal,
          );
    const storagePath = await uploadGenerationImage(
      session.tenantId,
      generationId,
      result.bytes,
      result.mimeType,
    );
    const generation = await markGenerationSucceeded(
      generationId,
      storagePath,
      Date.now() - started,
    );
    refresh();
    return { status: "succeeded", generation };
  } catch (error) {
    const code =
      error instanceof ImageGenerationError
        ? error.code
        : "provider_error";
    const message =
      error instanceof Error ? error.message : "Generation failed";
    await markGenerationFailed(generationId, code, Date.now() - started);
    refresh();
    return { status: "failed", code, message };
  } finally {
    clearTimeout(timeout);
  }
}
