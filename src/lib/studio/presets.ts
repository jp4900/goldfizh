import type { FormatChoice } from "@/lib/studio/types";

export type FormatPreset = {
  id: FormatChoice;
  label: string;
  aspectRatio: "1:1" | "4:5" | "16:9";
  compositionDirective: string;
};

export const formatPresets: FormatPreset[] = [
  {
    id: "1_1",
    label: "1:1 square",
    aspectRatio: "1:1",
    compositionDirective: "Square composition balanced for social tiles and avatars.",
  },
  {
    id: "4_5",
    label: "4:5 standing",
    aspectRatio: "4:5",
    compositionDirective: "Vertical portrait framing suited to feed posts and mobile hero slots.",
  },
  {
    id: "16_9",
    label: "16:9 horizontal",
    aspectRatio: "16:9",
    compositionDirective: "Wide cinematic framing for website heroes and presentation slides.",
  },
];

export function getFormatPreset(id: FormatChoice): FormatPreset {
  const preset = formatPresets.find((entry) => entry.id === id);
  if (!preset) {
    throw new Error(`Unknown format preset: ${id}`);
  }
  return preset;
}
