import type { IncomingTab } from "./capture";

/**
 * Links from pasted text or a bookmarks file, so tabs can come in without an
 * extension: bookmark all tabs (⌘⇧D), copy them in the bookmark manager, and
 * paste. Handles plain URLs (one per line or mixed with text), Markdown
 * links, copied HTML and Netscape bookmark exports (folders become rooms).
 */

const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};
function decode(s: string): string {
  return s
    .replace(/<[^>]*>/g, "")
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) => {
      if (e[0] === "#") {
        const code =
          e[1] === "x" || e[1] === "X"
            ? parseInt(e.slice(2), 16)
            : parseInt(e.slice(1), 10);
        return Number.isFinite(code) ? String.fromCodePoint(code) : m;
      }
      return ENTITIES[e.toLowerCase()] ?? m;
    })
    .replace(/\s+/g, " ")
    .trim();
}

const URL_RE = /https?:\/\/[^\s<>"'`）】」』]+/gi;
const clean = (url: string) => url.replace(/[.,;:!?)\]}>，。、]+$/, "");
const valid = (url: string) => {
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
};

function fromHtml(html: string): IncomingTab[] {
  const out: IncomingTab[] = [];
  const folders: (string | null)[] = [];
  let pending: string | null = null;
  const re =
    /<h3[^>]*>([\s\S]*?)<\/h3>|<dl[^>]*>|<\/dl>|<a\s[^>]*?href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  for (const m of html.matchAll(re)) {
    const tag = m[0].slice(0, 3).toLowerCase();
    if (m[1] !== undefined) pending = decode(m[1]);
    else if (tag === "<dl") {
      folders.push(pending);
      pending = null;
    } else if (tag === "</d") folders.pop();
    else if (m[2]) {
      const url = decode(m[2]);
      if (!valid(url)) continue;
      const group = [...folders].reverse().find((f) => f) ?? "";
      out.push({ url, title: decode(m[3] ?? ""), group });
    }
  }
  return out;
}

function fromText(text: string): IncomingTab[] {
  const out: IncomingTab[] = [];
  for (const line of text.split(/\r?\n/)) {
    const md = [...line.matchAll(/\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/g)];
    if (md.length) {
      for (const m of md) out.push({ url: m[2], title: m[1].trim() });
      continue;
    }
    const urls = (line.match(URL_RE) ?? []).map(clean).filter(valid);
    // "Title  https://…" on one line: keep the words as the title.
    const rest = line
      .replace(URL_RE, "")
      .replace(/[\s\-–—|:]+$/, "")
      .trim();
    for (const url of urls)
      out.push({ url, title: urls.length === 1 && rest ? rest : "" });
  }
  return out;
}

export function parseLinks(text: string, html = ""): IncomingTab[] {
  const found = /<a\s[^>]*href/i.test(html)
    ? fromHtml(html)
    : /<a\s[^>]*href/i.test(text)
      ? fromHtml(text)
      : fromText(text);
  const seen = new Set<string>();
  return found.filter((t) => !seen.has(t.url) && !!seen.add(t.url));
}
