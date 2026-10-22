import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import {
  DEMO_SESSION_COOKIE,
  demoUsers,
  resolveDemoSessionKey,
} from "@/lib/demo-sessions";

export type DemoSession = {
  userId: string;
  tenantId: string;
  tenantSlug: string;
  tenantName: string;
};

export const getSession = cache(async (): Promise<DemoSession> => {
  const cookieStore = await cookies();
  const raw = cookieStore.get(DEMO_SESSION_COOKIE)?.value;
  const key = resolveDemoSessionKey(raw);
  const entry = demoUsers[key];
  return {
    userId: entry.userId,
    tenantId: entry.tenantId,
    tenantSlug: entry.tenantSlug,
    tenantName: entry.tenantName,
  };
});
