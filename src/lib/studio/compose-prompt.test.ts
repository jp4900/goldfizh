import { describe, expect, it } from "vitest";
import { composePrompt } from "@/lib/studio/compose-prompt";
import type {
  BrandAssetWithBytes,
  BrandProfile,
  GenerationRequest,
  VisionGuideline,
} from "@/lib/studio/types";

const vision: VisionGuideline = {
  id: "v1",
  version: 1,
  principles: ["Clarity"],
  qualityBar: "High quality",
  avoid: ["watermarks"],
};

const brand: BrandProfile = {
  id: "b1",
  tenantId: "t1",
  version: 1,
  visualStyle: "Minimal fintech",
  composition: "Centered",
  moods: ["calm"],
  avoid: ["neon"],
  contentPages: [
    { url: "https://example.com/home", label: "Home" },
  ],
  segments: ["Retail"],
  palette: [{ hex: "#FFFFFF", role: "primary" }],
};

const request: GenerationRequest = {
  pageUrl: "https://example.com/home",
  brandSegment: "Retail",
  style: "simple",
  styleOther: null,
  colors: "vibrant",
  colorsOther: null,
  mainColorHex: "#FFFFFF",
  format: "16_9",
};

describe("composePrompt", () => {
  it("merges avoid lists from vision and brand", () => {
    const spec = composePrompt(vision, brand, [], request, "test-model");
    expect(spec.prompt).toContain("watermarks");
    expect(spec.prompt).toContain("neon");
    expect(spec.aspectRatio).toBe("16:9");
  });

  it("includes reference asset ids when provided", () => {
    const assets: BrandAssetWithBytes[] = [
      {
        id: "a1",
        tenantId: "t1",
        kind: "style_reference",
        storagePath: "path",
        mimeType: "image/png",
        description: "ref",
        bytes: new Uint8Array([1, 2, 3]),
      },
    ];
    const spec = composePrompt(vision, brand, assets, request, "test-model");
    expect(spec.referenceAssetIds).toEqual(["a1"]);
    expect(spec.prompt).toContain("attached reference images");
  });
});
