import "server-only";
import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  SUPABASE_SECRET_KEY: z.string().min(1),
  GEMINI_API_KEY: z.string().min(1).optional(),
  GEMINI_IMAGE_MODEL: z
    .string()
    .optional()
    .transform((value) =>
      value?.trim() ? value.trim() : "gemini-nano-banana-2.1",
    ),
  POLLINATIONS_API_KEY: z.string().min(1).optional(),
});

export type ServerEnv = z.infer<typeof envSchema>;

let cached: ServerEnv | null = null;

export function getServerEnv(): ServerEnv {
  if (cached) {
    return cached;
  }
  cached = envSchema.parse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    GEMINI_IMAGE_MODEL: process.env.GEMINI_IMAGE_MODEL,
    POLLINATIONS_API_KEY: process.env.POLLINATIONS_API_KEY,
  });
  return cached;
}
