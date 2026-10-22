import { connection } from "next/server";
import { GenerationForm } from "@/app/components/studio/generation-form";
import { StudioHeader } from "@/app/components/studio/studio-header";
import { loadStudioContext } from "@/lib/studio/data";
import { getSession } from "@/lib/session";

export const maxDuration = 60;

export default async function StudioPage() {
  await connection();
  const session = await getSession();
  const studio = await loadStudioContext(session);

  return (
    <div className="min-h-screen bg-[#f3f4f6]">
      <StudioHeader
        tenantName={studio.tenantName}
        activeSessionKey={session.tenantSlug}
      />
      <GenerationForm
        contentPages={studio.contentPages}
        segments={studio.segments}
        palette={studio.palette}
        latestGeneration={studio.latestGeneration}
      />
    </div>
  );
}
