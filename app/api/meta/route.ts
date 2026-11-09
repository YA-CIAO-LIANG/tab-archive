import { lookup } from "node:dns/promises";
import { NextResponse, type NextRequest } from "next/server";
import { getServerSupabase } from "@/auth/server";
import { parseMeta } from "@/lib/meta";
import { isPublicAddress } from "@/lib/ssrf";

/**
 * Title, description, preview image and icon for a page, for the signed-in
 * user's previews. Only public http(s) addresses, a few redirects, a short
 * timeout and the first 512 KB.
 */

const MAX_BYTES = 512 * 1024;
const TIMEOUT_MS = 6000;
const MAX_REDIRECTS = 3;

async function safeUrl(raw: string): Promise<URL | null> {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  if (url.username || url.password) return null;
  try {
    const addresses = await lookup(url.hostname, { all: true });
    if (
      !addresses.length ||
      !addresses.every((a) => isPublicAddress(a.address))
    ) {
      return null;
    }
  } catch {
    return null;
  }
  return url;
}

async function readHead(res: Response): Promise<string> {
  const reader = res.body?.getReader();
  if (!reader) return "";
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (size < MAX_BYTES) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    size += value.length;
    // The <head> is all we need.
    if (new TextDecoder().decode(value).includes("</head>")) break;
  }
  reader.cancel().catch(() => {});
  const all = new Uint8Array(size);
  let at = 0;
  for (const c of chunks) {
    all.set(c, at);
    at += c.length;
  }
  return new TextDecoder("utf-8", { fatal: false }).decode(all);
}

export async function GET(request: NextRequest) {
  const supabase = await getServerSupabase();
  const { data } = (await supabase?.auth.getUser()) ?? { data: { user: null } };
  if (!data.user)
    return NextResponse.json({ error: "sign_in" }, { status: 401 });

  let url = await safeUrl(request.nextUrl.searchParams.get("url") ?? "");
  const signal = AbortSignal.timeout(TIMEOUT_MS);
  try {
    for (let hop = 0; url && hop <= MAX_REDIRECTS; hop++) {
      const res = await fetch(url, {
        redirect: "manual",
        signal,
        headers: {
          "user-agent":
            "Mozilla/5.0 (compatible; TabArchive/1.0; link preview)",
          accept: "text/html,application/xhtml+xml",
          "accept-language": "zh-TW,zh;q=0.9,en;q=0.8",
        },
      });
      const location = res.headers.get("location");
      if (res.status >= 300 && res.status < 400 && location) {
        url = await safeUrl(new URL(location, url).href);
        continue;
      }
      if (!res.ok || !/html/i.test(res.headers.get("content-type") ?? ""))
        break;
      const meta = parseMeta(await readHead(res), url.href);
      return NextResponse.json(meta, {
        headers: { "cache-control": "private, max-age=86400" },
      });
    }
  } catch {
    // Timeouts and network errors: no preview.
  }
  return NextResponse.json({ error: "unavailable" }, { status: 422 });
}
