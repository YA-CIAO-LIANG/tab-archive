import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseConfig } from "./config";

let client: Promise<SupabaseClient | null> | null = null;

/**
 * The Supabase client for Client Components (one per page load; the session
 * lives in cookies shared with the server), or null when not configured.
 */
export function loadBrowserSupabase(): Promise<SupabaseClient | null> {
  if (!supabaseConfig) return Promise.resolve(null);
  const { url, publishableKey } = supabaseConfig;
  client ??= import("@supabase/ssr").then(({ createBrowserClient }) =>
    createBrowserClient(url, publishableKey),
  );
  return client.catch((error: unknown) => {
    client = null;
    throw error;
  });
}

export const accountsConfigured = supabaseConfig !== null;
