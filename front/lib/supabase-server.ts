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

function validateServerKey(serviceRoleKey: string): string | null {
  const key = serviceRoleKey.trim();

  // Supabase modern server-side secret key format.
  if (key.startsWith("sb_secret_")) {
    return null;
  }

  // Reject explicit client-side key format.
  if (key.startsWith("sb_publishable_")) {
    return "SUPABASE_SERVICE_ROLE_KEY is using a publishable key. Use sb_secret_... or a legacy service_role JWT.";
  }

  // Legacy JWT key format.
  const role = parseJwtRole(key);
  if (role === "service_role") {
    return null;
  }
  if (role === "anon" || role === "authenticated") {
    return `SUPABASE_SERVICE_ROLE_KEY is using JWT role "${role}". Use role "service_role".`;
  }
  return 'SUPABASE_SERVICE_ROLE_KEY format is invalid. Use sb_secret_... or a legacy JWT with role "service_role".';
}

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    return null;
  }
  const keyError = validateServerKey(serviceRoleKey);
  if (keyError) {
    throw new Error(keyError);
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
