"use client";

export default function StudioError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#f3f4f6] p-6">
      <p className="text-sm text-[#374151]">{error.message}</p>
      <button
        type="button"
        onClick={() => reset()}
        className="rounded-md bg-[#4b7bf5] px-4 py-2 text-sm font-medium text-white"
      >
        Try again
      </button>
    </div>
  );
}
