import { getFormatPreset } from "@/lib/studio/presets";
import type {
  BrandAssetWithBytes,
  BrandProfile,
  GenerationRequest,
  ImagePromptSpec,
  VisionGuideline,
} from "@/lib/studio/types";

function resolveStyleDirective(request: GenerationRequest): string {
  if (request.style === "simple") {
    return "Clean, straightforward visuals with clear focal points and minimal ornament.";
  }
  if (request.style === "abstract") {
    return "Abstract, conceptual interpretation while remaining readable and on-brand.";
  }
  const detail = request.styleOther?.trim();
  if (!detail) {
    return "Custom stylistic direction aligned with the brand profile.";
  }
  return detail;
}

function resolveColorsDirective(request: GenerationRequest): string {
  if (request.colors === "vibrant") {
    return "Rich, saturated color energy within the brand palette.";
  }
  if (request.colors === "black_white") {
    return "Monochrome or near-monochrome treatment with tonal depth.";
  }
  const detail = request.colorsOther?.trim();
  if (!detail) {
    return "Custom color treatment aligned with the brand palette.";
  }
  return detail;
}

function mergeAvoidLists(
  vision: VisionGuideline,
  brand: BrandProfile,
): string[] {
  const merged = new Set<string>([...vision.avoid, ...brand.avoid]);
  return [...merged];
}

export function composePrompt(
  vision: VisionGuideline,
  brand: BrandProfile,
  referenceAssets: BrandAssetWithBytes[],
  request: GenerationRequest,
  model: string,
): ImagePromptSpec {
  const format = getFormatPreset(request.format);
  const page = brand.contentPages.find((entry) => entry.url === request.pageUrl);
  const pageLabel = page?.label ?? request.pageUrl;
  const styleDirective = resolveStyleDirective(request);
  const colorsDirective = resolveColorsDirective(request);
  const avoid = mergeAvoidLists(vision, brand);
  const referenceNote =
    referenceAssets.length > 0
      ? `Use the attached reference images only for lighting, color grading, texture, and composition cues. Do not copy identifiable subjects from references.`
      : `No reference images attached; rely on the brand description below.`;

  const prompt = [
    `Create a single marketing image for ${pageLabel} (${request.pageUrl}) targeting the "${request.brandSegment}" segment.`,
    `Brand visual identity: ${brand.visualStyle}`,
    `Composition guidance: ${brand.composition}. ${format.compositionDirective}`,
    `User style preference: ${styleDirective}`,
    `User color preference: ${colorsDirective}. Feature main accent color ${request.mainColorHex} prominently in the scene.`,
    `Goldfizh quality standard (v${vision.version}): ${vision.qualityBar}`,
    `Goldfizh principles: ${vision.principles.join("; ")}.`,
    referenceNote,
    `Strict constraints — never include: ${avoid.join(", ")}.`,
    `Output a polished, photorealistic or high-quality illustrated scene suitable for immediate publication.`,
  ].join("\n\n");

  return {
    prompt,
    aspectRatio: format.aspectRatio,
    imageSize: "2K",
    model,
    visionGuidelineId: vision.id,
    brandProfileId: brand.id,
    referenceAssetIds: referenceAssets.map((asset) => asset.id),
    request,
  };
}
