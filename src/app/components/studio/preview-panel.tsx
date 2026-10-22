"use client";

import Image from "next/image";
import type { GenerationDTO } from "@/lib/studio/types";

type PreviewPanelProps = {
  generation: GenerationDTO | null;
  pending: boolean;
  errorMessage: string | null;
};

function PreviewPlaceholder() {
  return (
    <div className="flex h-full min-h-105 flex-col items-center justify-center rounded-lg border border-dashed border-[#c5d4e8] bg-[#eef3f9]">
      <svg
        width="40"
        height="40"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden
        className="text-[#9db3cc]"
      >
        <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M3 15l5-4 4 3 3-2 6 5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="8" cy="9" r="1.5" fill="currentColor" />
      </svg>
    </div>
  );
}

function statusLabel(
  generation: GenerationDTO | null,
  pending: boolean,
  errorMessage: string | null,
): string {
  if (pending) {
    return "Generating…";
  }
  if (errorMessage) {
    return "Generation failed";
  }
  if (generation?.status === "succeeded") {
    return "Generated";
  }
  if (generation?.status === "failed") {
    return "Generation failed";
  }
  return "Nothing generated";
}

export function PreviewPanel({
  generation,
  pending,
  errorMessage,
}: PreviewPanelProps) {
  const badge = statusLabel(generation, pending, errorMessage);
  const showImage =
    !pending && generation?.status === "succeeded" && generation.imageUrl;

  return (
    <section className="rounded-xl border border-[#e5e7eb] bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[#111827]">Example</h2>
        <span className="rounded-full bg-[#f3f4f6] px-3 py-1 text-sm text-[#6b7280]">
          {badge}
        </span>
      </div>
      {showImage ? (
        <div className="relative min-h-105 overflow-hidden rounded-lg border border-[#e5e7eb] bg-[#eef3f9]">
          <Image
            src={generation.imageUrl!}
            alt="Generated example"
            fill
            className="object-contain"
            unoptimized
          />
        </div>
      ) : (
        <PreviewPlaceholder />
      )}
      {errorMessage ? (
        <p className="mt-3 text-sm text-red-600" role="alert">{errorMessage}</p>
      ) : null}
      {generation?.prompt ? (
        <details className="mt-4 text-sm text-[#6b7280]">
          <summary className="cursor-pointer select-none">Prompt</summary>
          <p className="mt-2 whitespace-pre-wrap text-[#374151]">{generation.prompt}</p>
        </details>
      ) : null}
    </section>
  );
}
