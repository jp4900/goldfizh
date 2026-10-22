"use client";

import { demoSessionOptions } from "@/lib/demo-sessions";
import { switchDemoSession } from "@/lib/session-actions";

type StudioHeaderProps = {
  tenantName: string;
  activeSessionKey: string;
};

export function StudioHeader({ tenantName, activeSessionKey }: StudioHeaderProps) {
  return (
    <header className="border-b border-[#e5e7eb] bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4">
          <h1 className="text-base font-semibold text-[#111827]">
            {tenantName} - image generator
          </h1>
          <label className="sr-only" htmlFor="demo-session">Client</label>
          <select
            id="demo-session"
            className="rounded-md border border-[#e5e7eb] bg-white px-2 py-1 text-xs text-[#6b7280]"
            value={activeSessionKey}
            onChange={(event) => {
              void switchDemoSession(event.target.value).then(() => {
                window.location.reload();
              });
            }}
          >
            {demoSessionOptions.map((option) => (
              <option key={option.key} value={option.key}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <p className="text-sm text-[#6b7280]">Step 1 of 2</p>
      </div>
    </header>
  );
}
