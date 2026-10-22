import "server-only";
import { getServerEnv } from "@/lib/env";
import {
  ImageGenerationError,
  type ImageGenerationResult,
} from "@/lib/gemini/gemini-image-generator";

const maxPromptChars = 1200;
const maxAttempts = 3;

function dimensions(aspectRatio: "1:1" | "4:5" | "16:9"): {
  width: number;
  height: number;
} {
  switch (aspectRatio) {
    case "1:1":
      return { width: 768, height: 768 };
    case "4:5":
      return { width: 614, height: 768 };
    case "16:9":
      return { width: 768, height: 432 };
  }
}

function shortenPromptForUrl(prompt: string): string {
  const trimmed = prompt.trim();
  if (trimmed.length <= maxPromptChars) {
    return trimmed;
  }
  return `${trimmed.slice(0, maxPromptChars - 3)}...`;
}

function buildLegacyUrl(prompt: string, width: number, height: number): string {
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}`;
}

function buildGenUrl(
  prompt: string,
  width: number,
  height: number,
  apiKey: string,
): string {
  const params = new URLSearchParams({
    model: "black-forest-labs/flux.1-schnell",
    width: String(width),
    height: String(height),
    key: apiKey,
  });
  return `https://gen.pollinations.ai/image/${encodeURIComponent(prompt)}?${params}`;
}

function retryDelayMs(response: Response, attempt: number): number {
  const retryAfter = response.headers.get("retry-after");
  if (retryAfter) {
    const seconds = Number.parseInt(retryAfter, 10);
    if (!Number.isNaN(seconds) && seconds > 0) {
      return seconds * 1000;
    }
  }
  return 2000 * attempt;
}

function isRetryableStatus(status: number): boolean {
  return status === 429 || status === 502 || status === 503;
}

async function sleep(ms: number, signal: AbortSignal) {
  if (signal.aborted) {
    throw new ImageGenerationError("timeout", "Generation aborted");
  }
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(new ImageGenerationError("timeout", "Generation aborted"));
    };
    signal.addEventListener("abort", onAbort, { once: true });
  });
}

async function fetchWithRetries(
  url: string,
  signal: AbortSignal,
): Promise<ImageGenerationResult> {
  let lastMessage = "Pollinations failed";

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const response = await fetch(url, { signal });

    if (response.status === 402) {
      throw new ImageGenerationError(
        "rate_limited",
        "Pollinations free queue is full. Wait about 45 seconds and try again.",
      );
    }

    if (!response.ok) {
      lastMessage = `Pollinations request failed (${response.status})`;
      if (isRetryableStatus(response.status) && attempt < maxAttempts) {
        await sleep(retryDelayMs(response, attempt), signal);
        continue;
      }
      throw new ImageGenerationError(
        isRetryableStatus(response.status) ? "rate_limited" : "provider_error",
        lastMessage,
      );
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("image")) {
      lastMessage = "Pollinations did not return an image";
      if (attempt < maxAttempts) {
        await sleep(2000 * attempt, signal);
        continue;
      }
      throw new ImageGenerationError("provider_error", lastMessage);
    }

    const buffer = await response.arrayBuffer();
    return {
      bytes: new Uint8Array(buffer),
      mimeType: contentType.includes("png") ? "image/png" : "image/jpeg",
    };
  }

  throw new ImageGenerationError("provider_error", lastMessage);
}

export async function generatePollinationsImage(
  prompt: string,
  aspectRatio: "1:1" | "4:5" | "16:9",
  signal: AbortSignal,
): Promise<ImageGenerationResult> {
  const { width, height } = dimensions(aspectRatio);
  const shortPrompt = shortenPromptForUrl(prompt);
  const env = getServerEnv();
  const apiKey = env.POLLINATIONS_API_KEY?.trim();

  const url = apiKey
    ? buildGenUrl(shortPrompt, width, height, apiKey)
    : buildLegacyUrl(shortPrompt, width, height);

  try {
    return await fetchWithRetries(url, signal);
  } catch (error) {
    if (!(error instanceof ImageGenerationError)) {
      throw error;
    }
    if (apiKey) {
      throw error;
    }
    if (error.code === "rate_limited") {
      throw new ImageGenerationError(
        "rate_limited",
        `${error.message} Optional: add POLLINATIONS_API_KEY from enter.pollinations.ai for gen.pollinations.ai.`,
      );
    }
    throw new ImageGenerationError(
      "provider_error",
      `${error.message} The legacy free endpoint is often overloaded. Add POLLINATIONS_API_KEY (enter.pollinations.ai) or use Gemini.`,
    );
  }
}
