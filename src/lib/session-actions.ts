"use server";

import { cookies } from "next/headers";
import { DEMO_SESSION_COOKIE } from "@/lib/demo-sessions";

export async function switchDemoSession(sessionKey: string) {
  const cookieStore = await cookies();
  cookieStore.set(DEMO_SESSION_COOKIE, sessionKey, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
}
