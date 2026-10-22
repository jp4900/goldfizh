"use client";

import type { PaletteSwatch } from "@/lib/studio/types";

type ColorSwatchesProps = {
  palette: PaletteSwatch[];
  value: string;
  onChange: (hex: string) => void;
};

export function ColorSwatches({ palette, value, onChange }: ColorSwatchesProps) {
  return (
    <div className="flex gap-3">
      {palette.map((swatch) => {
        const selected = swatch.hex.toLowerCase() === value.toLowerCase();
        return (
          <button
            key={swatch.hex}
            type="button"
            aria-label={swatch.role}
            onClick={() => onChange(swatch.hex)}
            className={
              selected
                ? "h-9 w-9 rounded-full ring-2 ring-[#4b7bf5] ring-offset-2"
                : "h-9 w-9 rounded-full"
            }
            style={{ backgroundColor: swatch.hex }}
          />
        );
      })}
    </div>
  );
}
