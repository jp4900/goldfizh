import { z } from "zod";

const hexColor = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color");

export const imageProviderSchema = z.enum(["pollinations", "gemini"]);

export type ImageProvider = z.infer<typeof imageProviderSchema>;

export const generationRequestSchema = z
  .object({
    provider: imageProviderSchema.default("pollinations"),
    pageUrl: z.string().min(1),
    brandSegment: z.string().min(1),
    style: z.enum(["simple", "abstract", "other"]),
    styleOther: z.string().max(80).optional(),
    colors: z.enum(["vibrant", "black_white", "other"]),
    colorsOther: z.string().max(80).optional(),
    mainColorHex: hexColor,
    format: z.enum(["1_1", "4_5", "16_9"]),
  })
  .superRefine((value, ctx) => {
    if (value.style === "other" && !value.styleOther?.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["styleOther"],
        message: "Describe the style",
      });
    }
    if (value.colors === "other" && !value.colorsOther?.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["colorsOther"],
        message: "Describe the colors",
      });
    }
  });

export type GenerationRequestInput = z.infer<typeof generationRequestSchema>;

export type ParsedGenerationRequest =
  | { ok: true; data: GenerationRequestInput }
  | { ok: false; fieldErrors: Record<string, string> };

export function parseGenerationRequest(
  formData: FormData,
  allowedPageUrls: string[],
  allowedSegments: string[],
): ParsedGenerationRequest {
  const raw = {
    provider: String(formData.get("provider") ?? "pollinations"),
    pageUrl: String(formData.get("pageUrl") ?? ""),
    brandSegment: String(formData.get("brandSegment") ?? ""),
    style: String(formData.get("style") ?? ""),
    styleOther: optionalString(formData.get("styleOther")),
    colors: String(formData.get("colors") ?? ""),
    colorsOther: optionalString(formData.get("colorsOther")),
    mainColorHex: String(formData.get("mainColorHex") ?? ""),
    format: String(formData.get("format") ?? ""),
  };

  const parsed = generationRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, fieldErrors: flattenZodErrors(parsed.error) };
  }

  if (!allowedPageUrls.includes(parsed.data.pageUrl)) {
    return { ok: false, fieldErrors: { pageUrl: "Unknown page" } };
  }

  if (!allowedSegments.includes(parsed.data.brandSegment)) {
    return { ok: false, fieldErrors: { brandSegment: "Unknown segment" } };
  }

  return { ok: true, data: parsed.data };
}

function flattenZodErrors(error: z.ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!fieldErrors[key]) {
      fieldErrors[key] = issue.message;
    }
  }
  return fieldErrors;
}

function optionalString(value: FormDataEntryValue | null): string | undefined {
  if (value === null) {
    return undefined;
  }
  const text = String(value).trim();
  return text.length > 0 ? text : undefined;
}
