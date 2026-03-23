import { createClient, SupabaseClient } from "@supabase/supabase-js";

let cachedClient: SupabaseClient | null = null;

function parseJwtRole(token: string): string | null {
  const parts = token.split(".");
  if (parts.length < 2) {
    return null;
  }
  try {
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8")) as {
      role?: unknown;
    };
    return typeof payload.role === "string" ? payload.role : null;
  } catch {
    return null;
  }
}

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    return null;
  }
  const role = parseJwtRole(serviceRoleKey);
  if (role !== "service_role") {
    throw new Error(
      `SUPABASE_SERVICE_ROLE_KEY is misconfigured. Expected JWT role "service_role" but received "${role ?? "unknown"}".`
    );
  }
  return { url, serviceRoleKey };
}

export function getSupabaseAdminClient(): SupabaseClient {
  if (cachedClient) {
    return cachedClient;
  }
  const config = getSupabaseConfig();
  if (!config) {
    throw new Error("Supabase is not configured. Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  }
  cachedClient = createClient(config.url, config.serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
  return cachedClient;
}
