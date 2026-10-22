export type DemoUserRecord = {
  userId: string;
  tenantId: string;
  tenantSlug: string;
  tenantName: string;
};

export const DEMO_SESSION_COOKIE = "gf_demo_session";
export const DEFAULT_DEMO_SESSION_KEY = "nordwind";

export const demoUsers: Record<string, DemoUserRecord> = {
  nordwind: {
    userId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    tenantId: "11111111-1111-4111-8111-111111111111",
    tenantSlug: "nordwind",
    tenantName: "Nordwind Bank",
  },
  roastworks: {
    userId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
    tenantId: "22222222-2222-4222-8222-222222222222",
    tenantSlug: "roastworks",
    tenantName: "Roastworks Coffee",
  },
};

export const demoSessionOptions = Object.entries(demoUsers).map(([key, value]) => ({
  key,
  label: value.tenantName,
}));

export function resolveDemoSessionKey(raw: string | undefined): string {
  if (raw !== undefined && raw in demoUsers) {
    return raw;
  }
  return DEFAULT_DEMO_SESSION_KEY;
}
