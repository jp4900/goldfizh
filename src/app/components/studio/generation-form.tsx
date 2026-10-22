"use client";

import { useActionState, useState } from "react";
import {
  generateImageAction,
  type GenerateImageState,
} from "@/app/studio/actions";
import { ChipGroup } from "@/app/components/studio/chip-group";
import { ColorSwatches } from "@/app/components/studio/color-swatches";
import { PreviewPanel } from "@/app/components/studio/preview-panel";
import { formatPresets } from "@/lib/studio/presets";
import type {
  ColorsChoice,
  FormatChoice,
  GenerationDTO,
  PaletteSwatch,
  StyleChoice,
  ContentPage,
} from "@/lib/studio/types";

const initialState: GenerateImageState = { status: "idle" };

type GenerationFormProps = {
  contentPages: ContentPage[];
  segments: string[];
  palette: PaletteSwatch[];
  latestGeneration: GenerationDTO | null;
};

export function GenerationForm({
  contentPages,
  segments,
  palette,
  latestGeneration,
}: GenerationFormProps) {
  const [state, formAction, pending] = useActionState(
    generateImageAction,
    initialState,
  );

  const [style, setStyle] = useState<StyleChoice>("simple");
  const [colors, setColors] = useState<ColorsChoice>("vibrant");
  const [format, setFormat] = useState<FormatChoice>("1_1");
  const [mainColorHex, setMainColorHex] = useState(palette[0]?.hex ?? "#FFFFFF");

  const generation =
    state.status === "succeeded" ? state.generation : latestGeneration;
  const fieldErrors = state.status === "invalid" ? state.fieldErrors : {};
  const errorMessage =
    state.status === "failed" ? state.message : null;

  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-6 py-8 lg:grid-cols-[380px_1fr]">
      <form action={formAction} className="rounded-xl border border-[#e5e7eb] bg-white p-6 shadow-sm">
        <h2 className="mb-6 text-lg font-semibold text-[#111827]">
          Generate a new image
        </h2>
        <div className="space-y-5">
          <Field label="Image model" error={fieldErrors.provider}>
            <select
              name="provider"
              defaultValue="pollinations"
              className="w-full rounded-md border border-[#d1d5db] bg-white px-3 py-2 text-sm text-[#374151]"
            >
              <option value="pollinations">Free (Pollinations)</option>
              <option value="gemini">Gemini (API key required)</option>
            </select>
          </Field>
          <Field label="Page from URL" error={fieldErrors.pageUrl}>
            <select
              name="pageUrl"
              required
              defaultValue=""
              className="w-full rounded-md border border-[#d1d5db] bg-white px-3 py-2 text-sm text-[#374151]"
            >
              <option value="" disabled>Pick a URL..</option>
              {contentPages.map((page) => (
                <option key={page.url} value={page.url}>
                  {page.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Brand segment" error={fieldErrors.brandSegment}>
            <select
              name="brandSegment"
              required
              defaultValue=""
              className="w-full rounded-md border border-[#d1d5db] bg-white px-3 py-2 text-sm text-[#374151]"
            >
              <option value="" disabled>Chose your brand segment</option>
              {segments.map((segment) => (
                <option key={segment} value={segment}>
                  {segment}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Style" error={fieldErrors.style}>
            <ChipGroup
              value={style}
              onChange={setStyle}
              options={[
                { value: "simple", label: "Simple" },
                { value: "abstract", label: "Abstract" },
                { value: "other", label: "Other" },
              ]}
            />
            <input type="hidden" name="style" value={style} />
            {style === "other" ? (
              <input
                name="styleOther"
                maxLength={80}
                placeholder="Describe style"
                className="mt-2 w-full rounded-md border border-[#d1d5db] px-3 py-2 text-sm"
              />
            ) : null}
            {fieldErrors.styleOther ? (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.styleOther}</p>
            ) : null}
          </Field>
          <Field label="Colors" error={fieldErrors.colors}>
            <ChipGroup
              value={colors}
              onChange={setColors}
              options={[
                { value: "vibrant", label: "Vibrant" },
                { value: "black_white", label: "Black & white" },
                { value: "other", label: "Other" },
              ]}
            />
            <input type="hidden" name="colors" value={colors} />
            {colors === "other" ? (
              <input
                name="colorsOther"
                maxLength={80}
                placeholder="Describe colors"
                className="mt-2 w-full rounded-md border border-[#d1d5db] px-3 py-2 text-sm"
              />
            ) : null}
            {fieldErrors.colorsOther ? (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.colorsOther}</p>
            ) : null}
          </Field>
          <Field label="Main color" error={fieldErrors.mainColorHex}>
            <ColorSwatches
              palette={palette}
              value={mainColorHex}
              onChange={setMainColorHex}
            />
            <input type="hidden" name="mainColorHex" value={mainColorHex} />
          </Field>
          <Field label="Format" error={fieldErrors.format}>
            <ChipGroup
              value={format}
              onChange={setFormat}
              options={formatPresets.map((preset) => ({
                value: preset.id,
                label: preset.label,
              }))}
            />
            <input type="hidden" name="format" value={format} />
          </Field>
        </div>
        <button
          type="submit"
          disabled={pending}
          className="mt-8 w-full rounded-md bg-[#4b7bf5] py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {pending ? "Generating…" : "Generate image"}
        </button>
      </form>
      <PreviewPanel
        generation={generation}
        pending={pending}
        errorMessage={errorMessage}
      />
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium text-[#374151]">{label}</p>
      {children}
      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
