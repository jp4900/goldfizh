export type ContentPage = {
  url: string;
  label: string;
};

export type PaletteSwatch = {
  hex: string;
  role: string;
};

export type VisionGuideline = {
  id: string;
  version: number;
  principles: string[];
  qualityBar: string;
  avoid: string[];
};

export type BrandProfile = {
  id: string;
  tenantId: string;
  version: number;
  visualStyle: string;
  composition: string;
  moods: string[];
  avoid: string[];
  contentPages: ContentPage[];
  segments: string[];
  palette: PaletteSwatch[];
};

export type BrandAssetWithBytes = {
  id: string;
  tenantId: string;
  kind: "style_reference" | "logo" | "product";
  storagePath: string;
  mimeType: string;
  description: string;
  bytes: Uint8Array;
};

export type StyleChoice = "simple" | "abstract" | "other";
export type ColorsChoice = "vibrant" | "black_white" | "other";
export type FormatChoice = "1_1" | "4_5" | "16_9";

export type GenerationRequest = {
  pageUrl: string;
  brandSegment: string;
  style: StyleChoice;
  styleOther: string | null;
  colors: ColorsChoice;
  colorsOther: string | null;
  mainColorHex: string;
  format: FormatChoice;
};

export type ImagePromptSpec = {
  prompt: string;
  aspectRatio: "1:1" | "4:5" | "16:9";
  imageSize: "1K" | "2K";
  model: string;
  visionGuidelineId: string;
  brandProfileId: string;
  referenceAssetIds: string[];
  request: GenerationRequest;
};

export type GenerationStatus = "pending" | "succeeded" | "failed";

export type GenerationDTO = {
  id: string;
  status: GenerationStatus;
  imageUrl: string | null;
  prompt: string;
  request: GenerationRequest;
  errorCode: string | null;
  createdAt: string;
};
