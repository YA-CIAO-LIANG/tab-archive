import { GROUP_COLORS, type Group, type GroupColor, type Link } from "./types";
import type { Op, Snapshot } from "./store";

/** One tab sent by the extension, the share sheet, or a JSON import. */
export type IncomingTab = {
  url: string;
  title?: string;
  icon?: string;
  group?: string;
  color?: string;
  note?: string;
  tags?: string[];
  description?: string;
};
export type Incoming = { inbox: string; tabs: IncomingTab[] };
export type CaptureResult = {
  ops: Op[];
  added: number;
  dup: number;
  grouped: number;
};

const clip = (v: unknown, n: number) => String(v ?? "").slice(0, n);
const newId = () => crypto.randomUUID().replace(/-/g, "");

/**
 * Turns incoming tabs into writes: each tab goes to the room named after its
 * tab group (created if needed), otherwise to the inbox room. URLs already
 * in the archive, or repeated in the batch, are skipped.
 */
export function planCapture(
  existing: Snapshot,
  incoming: Incoming,
  now = new Date(),
): CaptureResult {
  const ops: Op[] = [];
  const rooms = new Map(existing.groups.map((g) => [g.name, g.id]));
  const seen = new Set(existing.links.map((l) => l.url));
  let position = Math.min(0, ...existing.groups.map((g) => g.position)) - 1;
  const stamp = now.toISOString();
  const roomFor = (name: string, color?: string) => {
    let id = rooms.get(name);
    if (!id) {
      id = newId();
      rooms.set(name, id);
      const group: Group = {
        id,
        name,
        color: GROUP_COLORS.includes(color as GroupColor)
          ? (color as GroupColor)
          : "none",
        position: position--,
        collapsed: false,
      };
      ops.push({ type: "set", col: "groups", doc: group });
    }
    return id;
  };

  let added = 0;
  let dup = 0;
  let grouped = 0;
  incoming.tabs.forEach((tab, i) => {
    const url = clip(tab.url, 4096);
    if (!/^https?:\/\//i.test(url)) return;
    if (seen.has(url)) {
      dup++;
      return;
    }
    seen.add(url);
    const groupName = clip(tab.group, 120).trim();
    if (groupName) grouped++;
    const link: Link = {
      id: newId(),
      group_id: roomFor(
        groupName || clip(incoming.inbox, 120) || "收件匣",
        tab.color,
      ),
      url,
      title: clip(tab.title, 1000) || url,
      note: clip(tab.note, 4000),
      tags: Array.isArray(tab.tags)
        ? tab.tags.map((t) => clip(t, 60)).slice(0, 30)
        : [],
      description: clip(tab.description, 2000),
      image: null,
      icon: /^https:\/\//.test(tab.icon ?? "") ? clip(tab.icon, 2048) : null,
      meta_fetched_at: null,
      position: now.getTime() / 1000 + i / 10000,
      created_at: stamp,
    };
    ops.push({ type: "set", col: "links", doc: link });
    added++;
  });
  return { ops, added, dup, grouped };
}

/** Tabs in the URL: the extension's #tabs=… or a share sheet's ?url=…. */
export function incomingFromLocation(
  hash: string,
  search: string,
): Incoming | null {
  if (hash.startsWith("#tabs=")) {
    try {
      const data = JSON.parse(decodeURIComponent(hash.slice(6))) as Incoming;
      if (Array.isArray(data.tabs))
        return { inbox: String(data.inbox ?? "收件匣"), tabs: data.tabs };
    } catch {
      return null;
    }
  }
  const params = new URLSearchParams(search);
  const url = `${params.get("url") ?? ""} ${params.get("text") ?? ""}`.match(
    /https?:\/\/\S+/,
  )?.[0];
  if (url)
    return {
      inbox: "收件匣",
      tabs: [{ url, title: params.get("title") ?? "" }],
    };
  return null;
}
