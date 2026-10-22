import "server-only";
import { createServiceSupabase } from "@/lib/supabase";
import type { DemoSession } from "@/lib/session";
import type {
  BrandAssetWithBytes,
  BrandProfile,
  ContentPage,
  GenerationDTO,
  GenerationRequest,
  GenerationStatus,
  ImagePromptSpec,
  PaletteSwatch,
  VisionGuideline,
} from "@/lib/studio/types";

const hourlyLimit = 20;
const generationsBucket = "generations";
const brandBucket = "brand-assets";

export class QuotaExceededError extends Error {
  readonly code = "quota_exceeded";

  constructor() {
    super("Generation quota exceeded");
  }
}

export async function assertWithinQuota(tenantId: string): Promise<void> {
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const supabase = createServiceSupabase();
  const { count, error } = await supabase
    .from("generations")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .gte("created_at", since);
  if (error) {
    throw new Error(`Quota check failed: ${error.message}`);
  }
  if ((count ?? 0) >= hourlyLimit) {
    throw new QuotaExceededError();
  }
}

export async function loadStudioContext(session: DemoSession) {
  const brand = await loadActiveBrand(session.tenantId);
  const latestGeneration = await findLatestGeneration(session);
  return {
    tenantName: session.tenantName,
    contentPages: brand.contentPages,
    segments: brand.segments,
    palette: brand.palette,
    latestGeneration,
  };
}

export async function loadGenerationContext(tenantId: string) {
  const vision = await loadActiveVision();
  const brand = await loadActiveBrand(tenantId);
  const referenceAssets = await loadReferenceAssets(tenantId);
  return { vision, brand, referenceAssets };
}

export async function createPendingGeneration(
  session: DemoSession,
  spec: ImagePromptSpec,
): Promise<string> {
  const supabase = createServiceSupabase();
  const { data, error } = await supabase
    .from("generations")
    .insert({
      tenant_id: session.tenantId,
      user_id: session.userId,
      status: "pending",
      request: spec.request,
      prompt: spec.prompt,
      vision_guideline_id: spec.visionGuidelineId,
      brand_profile_id: spec.brandProfileId,
      reference_asset_ids: spec.referenceAssetIds,
      model: spec.model,
      aspect_ratio: spec.aspectRatio,
      image_size: spec.imageSize,
    })
    .select("id")
    .single();
  if (error || !data) {
    throw new Error(`Failed to create generation: ${error?.message ?? "missing"}`);
  }
  return data.id;
}

export async function markGenerationSucceeded(
  generationId: string,
  storagePath: string,
  latencyMs: number,
): Promise<GenerationDTO> {
  const supabase = createServiceSupabase();
  const { data, error } = await supabase
    .from("generations")
    .update({
      status: "succeeded",
      storage_path: storagePath,
      latency_ms: latencyMs,
      completed_at: new Date().toISOString(),
      error_code: null,
    })
    .eq("id", generationId)
    .select("id, status, prompt, request, error_code, created_at, storage_path")
    .single();
  if (error || !data) {
    throw new Error(`Failed to mark succeeded: ${error?.message ?? "missing"}`);
  }
  const imageUrl = await createSignedGenerationUrl(storagePath);
  return toGeneration(data, imageUrl);
}

export async function markGenerationFailed(
  generationId: string,
  errorCode: string,
  latencyMs: number,
): Promise<void> {
  const supabase = createServiceSupabase();
  const { error } = await supabase
    .from("generations")
    .update({
      status: "failed",
      error_code: errorCode,
      latency_ms: latencyMs,
      completed_at: new Date().toISOString(),
    })
    .eq("id", generationId);
  if (error) {
    throw new Error(`Failed to mark failed: ${error.message}`);
  }
}

export async function uploadGenerationImage(
  tenantId: string,
  generationId: string,
  bytes: Uint8Array,
): Promise<string> {
  const path = `${tenantId}/${generationId}.png`;
  const supabase = createServiceSupabase();
  const { error } = await supabase.storage.from(generationsBucket).upload(path, bytes, {
    contentType: "image/png",
    upsert: true,
  });
  if (error) {
    throw new Error(`Failed to upload generation: ${error.message}`);
  }
  return path;
}

async function loadActiveVision(): Promise<VisionGuideline> {
  const supabase = createServiceSupabase();
  const { data, error } = await supabase
    .from("vision_guidelines")
    .select("id, version, principles, quality_bar, avoid")
    .eq("is_active", true)
    .maybeSingle();
  if (error) {
    throw new Error(`Supabase request failed (vision_guidelines): ${error.message}`);
  }
  if (!data) {
    throw new Error(
      "No active vision guideline in the database. Run supabase/seed.sql after migrations.",
    );
  }
  return {
    id: data.id,
    version: data.version,
    principles: data.principles,
    qualityBar: data.quality_bar,
    avoid: data.avoid,
  };
}

async function loadActiveBrand(tenantId: string): Promise<BrandProfile> {
  const supabase = createServiceSupabase();
  const { data, error } = await supabase
    .from("brand_profiles")
    .select(
      "id, tenant_id, version, visual_style, composition, moods, avoid, content_pages, segments, palette",
    )
    .eq("tenant_id", tenantId)
    .eq("is_active", true)
    .maybeSingle();
  if (error) {
    throw new Error(`Supabase request failed (brand_profiles): ${error.message}`);
  }
  if (!data) {
    throw new Error(
      "No active brand profile for this client. Run supabase/seed.sql after migrations.",
    );
  }
  return {
    id: data.id,
    tenantId: data.tenant_id,
    version: data.version,
    visualStyle: data.visual_style,
    composition: data.composition,
    moods: data.moods,
    avoid: data.avoid,
    contentPages: data.content_pages as ContentPage[],
    segments: data.segments as string[],
    palette: data.palette as PaletteSwatch[],
  };
}

async function loadReferenceAssets(tenantId: string): Promise<BrandAssetWithBytes[]> {
  const supabase = createServiceSupabase();
  const { data, error } = await supabase
    .from("brand_assets")
    .select("id, tenant_id, kind, storage_path, mime_type, description")
    .eq("tenant_id", tenantId)
    .eq("kind", "style_reference");
  if (error) {
    throw new Error(`Brand assets failed: ${error.message}`);
  }

  const assets: BrandAssetWithBytes[] = [];
  for (const row of data ?? []) {
    assets.push({
      id: row.id,
      tenantId: row.tenant_id,
      kind: row.kind,
      storagePath: row.storage_path,
      mimeType: row.mime_type,
      description: row.description,
      bytes: await downloadBrandAsset(row.storage_path),
    });
  }
  return assets;
}

async function findLatestGeneration(session: DemoSession): Promise<GenerationDTO | null> {
  const supabase = createServiceSupabase();
  const { data, error } = await supabase
    .from("generations")
    .select("id, status, prompt, request, error_code, created_at, storage_path")
    .eq("tenant_id", session.tenantId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) {
    return null;
  }
  const imageUrl =
    data.status === "succeeded" && data.storage_path
      ? await createSignedGenerationUrl(data.storage_path)
      : null;
  return toGeneration(data, imageUrl);
}

function toGeneration(
  row: {
    id: string;
    status: GenerationStatus;
    prompt: string;
    request: GenerationRequest;
    error_code: string | null;
    created_at: string;
  },
  imageUrl: string | null,
): GenerationDTO {
  return {
    id: row.id,
    status: row.status,
    imageUrl,
    prompt: row.prompt,
    request: row.request,
    errorCode: row.error_code,
    createdAt: row.created_at,
  };
}

async function downloadBrandAsset(path: string): Promise<Uint8Array> {
  const supabase = createServiceSupabase();
  const { data, error } = await supabase.storage.from(brandBucket).download(path);
  if (error || !data) {
    throw new Error(`Failed to download brand asset: ${error?.message ?? "missing"}`);
  }
  return new Uint8Array(await data.arrayBuffer());
}

async function createSignedGenerationUrl(path: string): Promise<string> {
  const supabase = createServiceSupabase();
  const { data, error } = await supabase.storage
    .from(generationsBucket)
    .createSignedUrl(path, 3600);
  if (error || !data?.signedUrl) {
    throw new Error(`Failed to sign generation url: ${error?.message ?? "missing"}`);
  }
  return data.signedUrl;
}
