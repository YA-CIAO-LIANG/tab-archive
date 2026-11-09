/** Supabase settings from the environment (same shape as ListenLoop). */
export type SupabaseConfig = {
  /** https://<ref>.supabase.co */
  url: string;
  /** The publishable (anon) key: public, safe in the browser. */
  publishableKey: string;
};

/**
 * The config if both values look usable, else null. The URL must be https,
 * except on this machine, where a local Supabase runs over http.
 */
export function readSupabaseConfig(
  url: string | undefined,
  publishableKey: string | undefined,
): SupabaseConfig | null {
  const trimmedUrl = url?.trim().replace(/\/+$/, "");
  const trimmedKey = publishableKey?.trim();
  if (!trimmedUrl || !trimmedKey) return null;
  try {
    const { protocol, hostname } = new URL(trimmedUrl);
    const local = hostname === "localhost" || hostname === "127.0.0.1";
    if (protocol !== "https:" && !(protocol === "http:" && local)) return null;
  } catch {
    return null;
  }
  return { url: trimmedUrl, publishableKey: trimmedKey };
}

// NEXT_PUBLIC_* must be read literally so Next.js inlines them.
export const supabaseConfig = readSupabaseConfig(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);
