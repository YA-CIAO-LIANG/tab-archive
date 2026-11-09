/** What a page says about itself, for previews. */
export type PageMeta = {
  title: string;
  description: string;
  image: string | null;
  icon: string | null;
};

const decode = (s: string) =>
  s
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n: string) =>
      String.fromCodePoint(parseInt(n, 16)),
    )
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();

/** Attributes of one tag, lower-cased names. */
function attrs(tag: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const m of tag.matchAll(
    /([a-zA-Z:-]+)\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/g,
  )) {
    out[m[1].toLowerCase()] = m[3] ?? m[4] ?? m[5] ?? "";
  }
  return out;
}

function absolute(value: string | undefined, base: string): string | null {
  if (!value) return null;
  try {
    const url = new URL(decode(value), base);
    return url.protocol === "https:" || url.protocol === "http:"
      ? url.href
      : null;
  } catch {
    return null;
  }
}

/** Largest side from a sizes="32x32 180x180" attribute (any = huge). */
function iconSize(sizes: string | undefined): number {
  if (!sizes) return 0;
  if (/any/i.test(sizes)) return 1000;
  return Math.max(0, ...sizes.split(/\s+/).map((s) => parseInt(s, 10) || 0));
}

/**
 * Title, description, preview image, and the largest icon from a page's
 * <head>. Pure string work, so it's safe on untrusted HTML.
 */
export function parseMeta(html: string, pageUrl: string): PageMeta {
  const head = html.slice(0, 300_000);
  const metas = new Map<string, string>();
  let best: { href: string; score: number } | null = null;

  for (const m of head.matchAll(/<(meta|link)\b[^>]*>/gi)) {
    const a = attrs(m[0]);
    if (m[1].toLowerCase() === "meta") {
      const key = (a.property ?? a.name ?? "").toLowerCase();
      if (key && a.content && !metas.has(key)) metas.set(key, a.content);
      continue;
    }
    const rel = (a.rel ?? "").toLowerCase();
    if (
      !a.href ||
      !/(^|\s)(icon|apple-touch-icon|apple-touch-icon-precomposed)(\s|$)/.test(
        rel,
      )
    ) {
      continue;
    }
    // Apple touch icons are 180px unless they say otherwise.
    const score = iconSize(a.sizes) || (rel.includes("apple") ? 180 : 16);
    if (!best || score > best.score) best = { href: a.href, score };
  }

  const titleTag = head.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
  const pick = (...keys: string[]) =>
    keys.map((k) => metas.get(k)).find((v) => v && v.trim()) ?? "";

  return {
    title: decode(pick("og:title", "twitter:title") || titleTag || "").slice(
      0,
      1000,
    ),
    description: decode(
      pick("og:description", "description", "twitter:description"),
    ).slice(0, 2000),
    image: absolute(
      pick(
        "og:image:secure_url",
        "og:image",
        "twitter:image",
        "twitter:image:src",
      ),
      pageUrl,
    ),
    icon: absolute(best?.href ?? "/favicon.ico", pageUrl),
  };
}
