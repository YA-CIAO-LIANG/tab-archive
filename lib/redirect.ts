/**
 * Where to go after signing in: a path on this site only. Anything else
 * ("//evil.example", "/\\evil.example", junk) becomes "/app", so the
 * callback can't be used as an open redirect.
 */
export function safeNextPath(value: string | null | undefined): string {
  const fallback = "/app";
  if (!value || !value.startsWith("/") || /^\/[/\\]/.test(value))
    return fallback;
  try {
    const url = new URL(value, "https://tab-archive.invalid");
    if (url.origin !== "https://tab-archive.invalid") return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}
