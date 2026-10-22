"use client";

type ChipOption<T extends string> = {
  value: T;
  label: string;
};

type ChipGroupProps<T extends string> = {
  options: ChipOption<T>[];
  value: T;
  onChange: (value: T) => void;
};

export function ChipGroup<T extends string>({
  options,
  value,
  onChange,
}: ChipGroupProps<T>) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <label
            key={option.value}
            className={
              selected
                ? "cursor-pointer rounded-md bg-[#4b7bf5] px-3 py-1.5 text-sm font-medium text-white"
                : "cursor-pointer rounded-md bg-[#eceef2] px-3 py-1.5 text-sm font-medium text-[#4b5563]"
            }
          >
            <input
              type="radio"
              value={option.value}
              checked={selected}
              onChange={() => onChange(option.value)}
              className="sr-only"
            />
            {option.label}
          </label>
        );
      })}
    </div>
  );
}
