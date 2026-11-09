"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Icon } from "@/components/Icons";
import { loadBrowserSupabase } from "@/lib/supabase/browser";
import {
  hostOf,
  VIEW_MODES,
  type Group,
  type GroupColor,
  type Link as Exhibit,
  type ViewMode,
} from "@/lib/types";

const VIEW_LABELS: Record<ViewMode, string> = {
  list: "列表",
  compact: "精簡",
  medium: "中圖",
  large: "大圖",
  icons: "圖示牆",
  gallery: "展覽",
};
const COLORS: Record<GroupColor, string> = {
  none: "transparent",
  grey: "#a3a9ad",
  blue: "#6f8fb8",
  red: "#bf7f78",
  yellow: "#c4a85a",
  green: "#719b84",
  pink: "#bd85a3",
  purple: "#8d80b3",
  cyan: "#6aa2ad",
  orange: "#c4925f",
};
const LINK_COLUMNS =
  "id, group_id, url, title, note, tags, description, image, icon, meta_fetched_at, position, created_at";
const GROUP_COLUMNS = "id, name, color, position, collapsed";
const INBOX = "收件匣";

type Room = {
  id: string;
  name: string;
  color: GroupColor;
  collapsed: boolean;
  virtual: boolean;
  links: Exhibit[];
};
type Undo = {
  label: string;
  run: () => Promise<void>;
  snapshot: { groups: Group[]; links: Exhibit[] };
};
export type DemoData = { groups: Group[]; links: Exhibit[] };

/**
 * A stand-in for Supabase on the demo page: every query chain resolves to
 * an empty success, so changes stay in the page.
 */
function offlineClient(): SupabaseClient {
  const chain: unknown = new Proxy(() => {}, {
    get: (_, key) =>
      key === "then"
        ? (resolve: (v: unknown) => void) =>
            resolve({ data: null, error: null })
        : chain,
    apply: () => chain,
  });
  return chain as SupabaseClient;
}

const pad = (n: number) => String(n).padStart(2, "0");
const pref = (key: string, value?: string) => {
  try {
    if (value === undefined) return localStorage.getItem(key);
    localStorage.setItem(key, value);
  } catch {
    // Private mode: preferences just don't stick.
  }
  return null;
};

/** Search words highlighted in text. */
function Highlight({ text, words }: { text: string; words: string[] }) {
  if (!words.length) return <>{text}</>;
  const re = new RegExp(
    `(${words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`,
    "gi",
  );
  return (
    <>
      {text
        .split(re)
        .map((part, i) => (i % 2 ? <mark key={i}>{part}</mark> : part))}
    </>
  );
}

/** The site's own icon, then Google's favicon service, then a letter. */
function Favicon({ link }: { link: Exhibit }) {
  const host = hostOf(link.url);
  const sources = [
    link.icon,
    `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=128`,
  ].filter((s): s is string => !!s);
  const [index, setIndex] = useState(0);
  return (
    <span className="favicon">
      {index < sources.length ? (
        <img
          src={sources[index]}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setIndex((i) => i + 1)}
        />
      ) : (
        <span>{(host[0] ?? "·").toUpperCase()}</span>
      )}
    </span>
  );
}

function Cover({ link }: { link: Exhibit }) {
  const [broken, setBroken] = useState(false);
  if (!link.image || broken) {
    return (
      <span className="cover blank">
        <Favicon link={link} />
      </span>
    );
  }
  return (
    <span className="cover">
      <img
        src={link.image}
        alt=""
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={() => setBroken(true)}
      />
    </span>
  );
}

export function Archive({ email, demo }: { email: string; demo?: DemoData }) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [links, setLinks] = useState<Exhibit[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [view, setView] = useState<ViewMode>("list");
  const [byDomain, setByDomain] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<string | null>(null);
  const [toast, setToast] = useState<{ text: string; undo?: boolean } | null>(
    null,
  );
  const [still, setStill] = useState(false);
  const [dropRoom, setDropRoom] = useState<string | null>(null);
  const undoStack = useRef<Undo[]>([]);
  const dragIds = useRef<string[]>([]);
  const enriching = useRef(new Set<string>());
  const searchRef = useRef<HTMLInputElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const db = useCallback(async (): Promise<SupabaseClient> => {
    if (demo) return offlineClient();
    const supabase = await loadBrowserSupabase();
    if (!supabase) throw new Error("not configured");
    return supabase;
  }, [demo]);

  const say = useCallback((text: string, undo = false) => {
    setToast({ text, undo });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), undo ? 6000 : 3500);
  }, []);

  // ------------------------------------------------------------ loading
  const load = useCallback(async () => {
    if (demo) {
      setGroups(demo.groups);
      setLinks(demo.links);
      setLoaded(true);
      return;
    }
    try {
      const supabase = await db();
      const [{ data: g, error: ge }, all] = await Promise.all([
        supabase.from("groups").select(GROUP_COLUMNS).order("position"),
        (async () => {
          const rows: Exhibit[] = [];
          for (let from = 0; ; from += 1000) {
            const { data, error } = await supabase
              .from("links")
              .select(LINK_COLUMNS)
              .order("position")
              .order("created_at")
              .range(from, from + 999);
            if (error) throw error;
            rows.push(...(data as Exhibit[]));
            if (data.length < 1000) return rows;
          }
        })(),
      ]);
      if (ge) throw ge;
      setGroups(g as Group[]);
      setLinks(all);
      setLoaded(true);
    } catch {
      say("讀取失敗，請重新整理頁面。");
    }
  }, [db, say, demo]);

  useEffect(() => {
    // Initial load of remote data, then again whenever the page comes back
    // into view (e.g. after capturing with the extension).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    const saved = pref("view") as ViewMode | null;
    if (saved && VIEW_MODES.includes(saved)) setView(saved);
    setStill(pref("still") === "1");
    const onVisible = () =>
      !demo && document.visibilityState === "visible" && load();
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [load, demo]);

  useEffect(() => {
    document.documentElement.classList.toggle("still", still);
  }, [still]);

  // ---------------------------------------- previews (網頁介紹 + icons)
  const enrich = useCallback(
    async (link: Exhibit) => {
      if (enriching.current.has(link.id)) return;
      enriching.current.add(link.id);
      const patch: Partial<Exhibit> = {
        meta_fetched_at: new Date().toISOString(),
      };
      try {
        const res = await fetch(
          `/api/meta?url=${encodeURIComponent(link.url)}`,
        );
        if (res.ok) {
          const meta = (await res.json()) as {
            title: string;
            description: string;
            image: string | null;
            icon: string | null;
          };
          if (meta.description) patch.description = meta.description;
          if (meta.image) patch.image = meta.image;
          if (meta.icon) patch.icon = meta.icon;
          if (meta.title && (!link.title || link.title === link.url))
            patch.title = meta.title;
        }
      } catch {
        // Offline or blocked: keep what we have, don't retry automatically.
      }
      setLinks((ls) =>
        ls.map((l) => (l.id === link.id ? { ...l, ...patch } : l)),
      );
      await (await db()).from("links").update(patch).eq("id", link.id);
      enriching.current.delete(link.id);
    },
    [db],
  );

  useEffect(() => {
    const pending = links.filter(
      (l) => !l.meta_fetched_at && !enriching.current.has(l.id),
    );
    if (!pending.length) return;
    let cancelled = false;
    (async () => {
      // Three at a time, so a big capture doesn't flood the network.
      for (let i = 0; i < pending.length && !cancelled; i += 3) {
        await Promise.all(pending.slice(i, i + 3).map(enrich));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [links, enrich]);

  // ------------------------------------------------------------ rooms
  const words = useMemo(
    () => query.trim().toLowerCase().split(/\s+/).filter(Boolean),
    [query],
  );
  const rooms: Room[] = useMemo(() => {
    const match = (l: Exhibit) => {
      if (!words.length) return true;
      const hay =
        `${l.title} ${l.url} ${l.note} ${l.description} ${l.tags.join(" ")}`.toLowerCase();
      return words.every((w) => hay.includes(w));
    };
    const shown = links.filter(match);
    if (byDomain) {
      const map = new Map<string, Exhibit[]>();
      for (const l of shown) {
        const h = hostOf(l.url);
        map.set(h, [...(map.get(h) ?? []), l]);
      }
      return [...map]
        .sort((a, b) => b[1].length - a[1].length)
        .map(([h, ls]) => ({
          id: `d:${h}`,
          name: h,
          color: "none",
          collapsed: false,
          virtual: true,
          links: ls,
        }));
    }
    const ids = new Set(groups.map((g) => g.id));
    const out: Room[] = groups.map((g) => ({
      ...g,
      virtual: false,
      links: shown.filter((l) => l.group_id === g.id),
    }));
    const orphans = shown.filter((l) => !l.group_id || !ids.has(l.group_id));
    if (orphans.length)
      out.push({
        id: "",
        name: "未分類",
        color: "none",
        collapsed: false,
        virtual: true,
        links: orphans,
      });
    return words.length ? out.filter((r) => r.links.length) : out;
  }, [links, groups, words, byDomain]);
  const shownCount = rooms.reduce((n, r) => n + r.links.length, 0);

  // ------------------------------------------------------------ changes
  const remember = (label: string, run: () => Promise<void>) => {
    undoStack.current.push({ label, run, snapshot: { groups, links } });
    if (undoStack.current.length > 30) undoStack.current.shift();
  };
  const guard = async (work: () => PromiseLike<{ error: unknown }>) => {
    const { error } = await work();
    if (error) {
      say("沒有存成功，已重新讀取。");
      load();
    }
  };

  async function undo() {
    const step = undoStack.current.pop();
    if (!step) return say("沒有可復原的動作");
    if (demo) {
      setGroups(step.snapshot.groups);
      setLinks(step.snapshot.links);
    } else {
      await step.run();
      await load();
    }
    say(`已復原：${step.label}`);
  }

  async function deleteLinks(ids: string[]) {
    const rows = links.filter((l) => ids.includes(l.id));
    setLinks((ls) => ls.filter((l) => !ids.includes(l.id)));
    setSelected(new Set());
    remember("刪除", async () => {
      await (await db()).from("links").insert(rows);
    });
    await guard(async () => (await db()).from("links").delete().in("id", ids));
    say(
      rows.length === 1
        ? `已刪除「${rows[0].title.slice(0, 30)}」`
        : `已刪除 ${rows.length} 個連結`,
      true,
    );
  }

  async function moveLinks(ids: string[], groupId: string) {
    const before = links
      .filter((l) => ids.includes(l.id))
      .map((l) => [l.id, l.group_id] as const);
    setLinks((ls) =>
      ls.map((l) => (ids.includes(l.id) ? { ...l, group_id: groupId } : l)),
    );
    setSelected(new Set());
    remember("移動", async () => {
      const supabase = await db();
      await Promise.all(
        before.map(([id, g]) =>
          supabase.from("links").update({ group_id: g }).eq("id", id),
        ),
      );
    });
    await guard(async () =>
      (await db()).from("links").update({ group_id: groupId }).in("id", ids),
    );
    say(
      `已移動 ${ids.length} 個連結到「${groups.find((g) => g.id === groupId)?.name ?? ""}」`,
      true,
    );
  }

  async function saveLink(id: string, patch: Partial<Exhibit>) {
    const old = links.find((l) => l.id === id);
    if (!old) return;
    const back = Object.fromEntries(
      Object.keys(patch).map((k) => [k, old[k as keyof Exhibit]]),
    );
    setLinks((ls) => ls.map((l) => (l.id === id ? { ...l, ...patch } : l)));
    setEditing(null);
    remember("編輯", async () => {
      await (await db()).from("links").update(back).eq("id", id);
    });
    await guard(async () =>
      (await db()).from("links").update(patch).eq("id", id),
    );
  }

  async function createGroup(name: string): Promise<Group | null> {
    const position = Math.min(0, ...groups.map((g) => g.position)) - 1;
    if (demo) {
      const group: Group = {
        id: crypto.randomUUID(),
        name,
        color: "none",
        position,
        collapsed: false,
      };
      setGroups((gs) => [group, ...gs]);
      return group;
    }
    const { data, error } = await (
      await db()
    )
      .from("groups")
      .insert({ name: name.slice(0, 120), position })
      .select(GROUP_COLUMNS)
      .single();
    if (error) {
      say("建立展區失敗");
      return null;
    }
    setGroups((gs) => [data as Group, ...gs]);
    return data as Group;
  }

  async function updateGroup(
    id: string,
    patch: Partial<Group>,
    label?: string,
  ) {
    const old = groups.find((g) => g.id === id);
    if (!old) return;
    setGroups((gs) => gs.map((g) => (g.id === id ? { ...g, ...patch } : g)));
    if (label) {
      const back = Object.fromEntries(
        Object.keys(patch).map((k) => [k, old[k as keyof Group]]),
      );
      remember(label, async () => {
        await (await db()).from("groups").update(back).eq("id", id);
      });
    }
    await guard(async () =>
      (await db()).from("groups").update(patch).eq("id", id),
    );
  }

  async function moveGroupUp(id: string) {
    const i = groups.findIndex((g) => g.id === id);
    if (i <= 0) return;
    const ordered = [...groups];
    [ordered[i - 1], ordered[i]] = [ordered[i], ordered[i - 1]];
    const renumbered = ordered.map((g, n) => ({ ...g, position: n }));
    setGroups(renumbered);
    const supabase = await db();
    await Promise.all(
      renumbered.map((g) =>
        supabase.from("groups").update({ position: g.position }).eq("id", g.id),
      ),
    );
  }

  async function deleteGroup(room: Room) {
    const group = groups.find((g) => g.id === room.id);
    if (!group) return;
    const inside = links.filter((l) => l.group_id === group.id);
    if (
      inside.length &&
      !confirm(
        `刪除展區「${group.name}」和裡面的 ${inside.length} 個連結？之後可以按「復原」。`,
      )
    )
      return;
    setGroups((gs) => gs.filter((g) => g.id !== group.id));
    setLinks((ls) => ls.filter((l) => l.group_id !== group.id));
    remember("刪除展區", async () => {
      const supabase = await db();
      await supabase.from("groups").insert(group);
      if (inside.length) await supabase.from("links").insert(inside);
    });
    const supabase = await db();
    if (inside.length)
      await supabase.from("links").delete().eq("group_id", group.id);
    await guard(() => supabase.from("groups").delete().eq("id", group.id));
    say(`已刪除展區「${group.name}」`, true);
  }

  async function addLink(raw: string) {
    let url = raw.trim();
    if (!url) return;
    if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
    try {
      url = new URL(url).href;
    } catch {
      return say("這不是有效的網址");
    }
    if (links.some((l) => l.url === url)) return say("這個連結已經收藏過了");
    const inbox =
      groups.find((g) => g.name === INBOX) ?? (await createGroup(INBOX));
    if (demo) {
      const now = new Date().toISOString();
      setLinks((ls) => [
        ...ls,
        {
          id: crypto.randomUUID(),
          group_id: inbox?.id ?? null,
          url,
          title: url,
          note: "",
          tags: [],
          description: "",
          image: null,
          icon: null,
          meta_fetched_at: now,
          position: Date.now(),
          created_at: now,
        },
      ]);
      return say("已加入收件匣（展示模式不會儲存，也不抓取網頁介紹）");
    }
    const { data, error } = await (
      await db()
    )
      .from("links")
      .insert({
        url,
        title: url,
        group_id: inbox?.id ?? null,
        position: Date.now() / 1000,
      })
      .select(LINK_COLUMNS)
      .single();
    if (error) return say("新增失敗");
    setLinks((ls) => [...ls, data as Exhibit]);
    say("已加入收件匣，正在抓取網頁介紹…");
  }

  function openAll(urls: string[]) {
    if (
      urls.length > 10 &&
      !confirm(`確定要一次開啟 ${urls.length} 個分頁嗎？`)
    )
      return;
    let blocked = 0;
    for (const u of urls) if (!window.open(u, "_blank", "noopener")) blocked++;
    if (blocked) say("瀏覽器擋下了部分分頁，請允許本網站開啟彈出式視窗。");
  }

  // ------------------------------------------------------------ keys
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const typing = target.matches("input, textarea, [contenteditable=true]");
      if (e.key === "/" && !typing) {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "z" && !typing) {
        e.preventDefault();
        undo();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  });

  const toggle = (id: string, on: boolean) =>
    setSelected((s) => {
      const next = new Set(s);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });

  // ------------------------------------------------------------ render
  function exhibit(link: Exhibit, number: number) {
    const host = hostOf(link.url);
    if (editing === link.id) {
      return (
        <form
          key={link.id}
          className="exhibit edit glass"
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            const url = String(f.get("url")).trim();
            saveLink(link.id, {
              title: String(f.get("title")).trim() || url,
              url: /^https?:\/\//.test(url) ? url : link.url,
              note: String(f.get("note")).trim(),
              tags: String(f.get("tags"))
                .split(/[,，]/)
                .map((t) => t.trim().replace(/^#/, ""))
                .filter(Boolean)
                .slice(0, 30),
            });
          }}
          onKeyDown={(e) => e.key === "Escape" && setEditing(null)}
        >
          <label className="field">
            標題
            <input name="title" defaultValue={link.title} autoFocus />
          </label>
          <label className="field">
            網址
            <input name="url" defaultValue={link.url} />
          </label>
          <label className="field">
            筆記
            <textarea
              name="note"
              defaultValue={link.note}
              rows={2}
              placeholder="為什麼留下它"
            />
          </label>
          <label className="field">
            標籤
            <input
              name="tags"
              defaultValue={link.tags.join(", ")}
              placeholder="以逗號分隔"
            />
          </label>
          <div className="row">
            <button
              type="button"
              className="text-btn"
              onClick={() => {
                setEditing(null);
                enrich({ ...link, meta_fetched_at: null });
              }}
            >
              重新抓取網頁介紹
            </button>
            <span style={{ flex: 1 }} />
            <button
              type="button"
              className="btn"
              onClick={() => setEditing(null)}
            >
              取消
            </button>
            <button className="btn primary">儲存</button>
          </div>
        </form>
      );
    }

    const isSel = selected.has(link.id);
    const title = (
      <a
        className="e-title"
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
      >
        <Highlight text={link.title || link.url} words={words} />
      </a>
    );
    const hostLine = (
      <span className="e-host" title={link.url}>
        <Highlight
          text={link.url.replace(/^https?:\/\/(www\.)?/, "")}
          words={words}
        />
      </span>
    );
    const desc = link.description ? (
      <p className="e-desc" style={{ margin: 0 }}>
        <Highlight text={link.description} words={words} />
      </p>
    ) : null;
    const note = link.note ? (
      <p className="e-note" style={{ margin: 0 }}>
        <Highlight text={link.note} words={words} />
      </p>
    ) : null;
    const tags = link.tags.length ? (
      <div className="e-tags">
        {link.tags.map((t) => (
          <button key={t} onClick={() => setQuery(t)}>
            #{t}
          </button>
        ))}
      </div>
    ) : null;
    const pick = (
      <input
        type="checkbox"
        className="pick"
        aria-label="選取"
        checked={isSel}
        onChange={(e) => toggle(link.id, e.target.checked)}
      />
    );
    const acts = (
      <div className="acts">
        <button
          className="icon-btn"
          title="編輯"
          onClick={() => setEditing(link.id)}
        >
          <Icon name="edit" />
        </button>
        <button
          className="icon-btn"
          title="刪除"
          onClick={() => deleteLinks([link.id])}
        >
          <Icon name="x" />
        </button>
      </div>
    );

    let inner: React.ReactNode;
    switch (view) {
      case "compact":
        inner = (
          <>
            {pick}
            <Favicon link={link} />
            <div className="e-body">
              {title}
              <span className="e-host">{host}</span>
            </div>
            {acts}
          </>
        );
        break;
      case "large":
        inner = (
          <>
            {pick}
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              tabIndex={-1}
            >
              <Cover link={link} />
            </a>
            <div className="e-body">
              <div className="e-head">
                <Favicon link={link} />
                <span className="e-host">{host}</span>
              </div>
              {title}
              {desc}
              {note}
              {tags}
            </div>
            {acts}
          </>
        );
        break;
      case "icons":
        inner = (
          <>
            {pick}
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              tabIndex={-1}
            >
              <Favicon link={link} />
            </a>
            {title}
            {acts}
          </>
        );
        break;
      case "gallery":
        inner = (
          <>
            {pick}
            <a
              className="frame"
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              tabIndex={-1}
            >
              <Cover link={link} />
            </a>
            <div className="placard">
              <span className="no">Nº {pad(number)}</span>
              {title}
              <span className="e-host">{host}</span>
              {desc}
              {note}
            </div>
            {acts}
          </>
        );
        break;
      default:
        inner = (
          <>
            {pick}
            <Favicon link={link} />
            <div className="e-body">
              {title}
              {hostLine}
              {view === "list" || view === "medium" ? desc : null}
              {note}
              {tags}
            </div>
            {acts}
          </>
        );
    }
    const cardLike = view === "medium" || view === "large";
    return (
      <div
        key={link.id}
        className={`exhibit ${cardLike ? "glass" : ""} ${isSel ? "selected" : ""}`}
        draggable={!byDomain}
        onDragStart={(e) => {
          dragIds.current = isSel ? [...selected] : [link.id];
          e.currentTarget.classList.add("dragging");
          e.dataTransfer.effectAllowed = "move";
        }}
        onDragEnd={(e) => {
          e.currentTarget.classList.remove("dragging");
          setDropRoom(null);
        }}
      >
        {inner}
      </div>
    );
  }

  let counter = 0;
  const listLike = view === "list" || view === "compact" || view === "icons";

  return (
    <div className={`v-${view} ${selected.size ? "selecting" : ""}`}>
      <header className="app-head glass">
        <div className="wrap">
          <div className="top">
            <div>
              <div className="eyebrow">
                Tab Archive — Nº {pad(links.length)}
              </div>
              <h1>{demo ? "展示典藏" : "我的典藏"}</h1>
            </div>
            <label className="search">
              <Icon name="search" />
              <input
                ref={searchRef}
                type="search"
                value={query}
                placeholder="搜尋標題、網址、介紹、筆記、標籤"
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Escape" && setQuery("")}
              />
              <kbd>/</kbd>
            </label>
            {demo ? (
              <Link className="btn primary" href="/login">
                免費註冊
              </Link>
            ) : (
              <Link className="text-btn" href="/account" title={email}>
                帳號
              </Link>
            )}
          </div>
          <div className="tools">
            <div className="views" role="group" aria-label="陳列方式">
              {VIEW_MODES.map((m) => (
                <button
                  key={m}
                  className={view === m ? "on" : ""}
                  title={VIEW_LABELS[m]}
                  onClick={() => {
                    setView(m);
                    pref("view", m);
                  }}
                >
                  <Icon name={m} />
                  <span>{VIEW_LABELS[m]}</span>
                </button>
              ))}
            </div>
            <span className="sep" />
            <button
              className={`text-btn ${!byDomain ? "on" : ""}`}
              onClick={() => setByDomain(false)}
            >
              依展區
            </button>
            <button
              className={`text-btn ${byDomain ? "on" : ""}`}
              onClick={() => setByDomain(true)}
            >
              依網域
            </button>
            <span className="sep" />
            <button
              className="text-btn"
              onClick={async () => {
                const name = prompt("新展區名稱");
                if (name?.trim()) await createGroup(name.trim());
              }}
            >
              新增展區
            </button>
            <button className="text-btn" onClick={undo} title="⌘Z">
              復原
            </button>
            <span className="spacer" />
            <span className="stats">
              {words.length
                ? `${shownCount} / ${links.length} 件`
                : `${links.length} 件 · ${groups.length} 區`}
            </span>
            <button
              className="text-btn"
              onClick={() => {
                setStill(!still);
                pref("still", still ? "0" : "1");
              }}
            >
              {still ? "鯨魚：靜止" : "鯨魚：游動"}
            </button>
          </div>
          <form
            className="add-link"
            onSubmit={(e) => {
              e.preventDefault();
              const input = e.currentTarget.elements.namedItem(
                "url",
              ) as HTMLInputElement;
              addLink(input.value);
              input.value = "";
            }}
          >
            <Icon name="plus" />
            <input
              name="url"
              inputMode="url"
              placeholder="貼上網址，新增到收件匣"
              aria-label="新增連結"
            />
          </form>
        </div>
      </header>

      <main className="wrap archive">
        {!loaded ? (
          <div className="empty glass">
            <p>讀取典藏中…</p>
          </div>
        ) : !links.length ? (
          <div className="empty glass">
            <h2>典藏尚空</h2>
            <p>
              安裝瀏覽器擴充功能，一鍵收藏所有分頁；或在上方貼上網址。
              <br />
              <Link className="text-btn" href="/account">
                取得擴充功能與收藏金鑰 →
              </Link>
            </p>
          </div>
        ) : !rooms.length ? (
          <div className="empty glass">
            <h2>查無結果</h2>
            <p>沒有符合「{query}」的連結</p>
          </div>
        ) : (
          rooms.map((room, i) => {
            const collapsed = room.collapsed && !words.length;
            const allSel =
              room.links.length > 0 &&
              room.links.every((l) => selected.has(l.id));
            return (
              <section
                key={room.id || "orphans"}
                className={`room ${collapsed ? "collapsed" : ""} ${dropRoom === room.id ? "drop" : ""}`}
                style={
                  { "--room-color": COLORS[room.color] } as React.CSSProperties
                }
                onDragOver={(e) => {
                  if (room.virtual || !dragIds.current.length) return;
                  e.preventDefault();
                  setDropRoom(room.id);
                }}
                onDrop={(e) => {
                  if (room.virtual) return;
                  e.preventDefault();
                  setDropRoom(null);
                  moveLinks(dragIds.current, room.id);
                  dragIds.current = [];
                }}
              >
                <div className="room-head">
                  <span className="room-no">{pad(i + 1)}</span>
                  {room.color !== "none" && <span className="swatch" />}
                  <span
                    className="room-name"
                    title={room.virtual ? undefined : "雙擊改名"}
                    onDoubleClick={(e) => {
                      if (room.virtual) return;
                      const el = e.currentTarget;
                      el.contentEditable = "true";
                      el.focus();
                      document.getSelection()?.selectAllChildren(el);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        e.currentTarget.blur();
                      }
                      if (e.key === "Escape") {
                        e.currentTarget.textContent = room.name;
                        e.currentTarget.blur();
                      }
                    }}
                    onBlur={(e) => {
                      e.currentTarget.contentEditable = "false";
                      const name = e.currentTarget.textContent?.trim();
                      if (name && name !== room.name)
                        updateGroup(
                          room.id,
                          { name: name.slice(0, 120) },
                          "改名",
                        );
                      else e.currentTarget.textContent = room.name;
                    }}
                  >
                    {room.name}
                  </span>
                  <span className="count">{room.links.length} 件</span>
                  <button
                    className="fold"
                    title="收合 / 展開"
                    onClick={() =>
                      !room.virtual &&
                      updateGroup(room.id, { collapsed: !room.collapsed })
                    }
                  >
                    <Icon name="chev" />
                  </button>
                  <div className="room-tools">
                    <label className="check">
                      <input
                        type="checkbox"
                        checked={allSel}
                        onChange={(e) =>
                          setSelected((s) => {
                            const next = new Set(s);
                            for (const l of room.links) {
                              if (e.target.checked) next.add(l.id);
                              else next.delete(l.id);
                            }
                            return next;
                          })
                        }
                      />
                      全選
                    </label>
                    <button
                      className="text-btn"
                      onClick={() => openAll(room.links.map((l) => l.url))}
                    >
                      全部開啟
                    </button>
                    {!room.virtual && (
                      <>
                        <button
                          className="icon-btn"
                          title="上移"
                          onClick={() => moveGroupUp(room.id)}
                        >
                          <Icon name="up" />
                        </button>
                        <button
                          className="icon-btn"
                          title="刪除展區"
                          onClick={() => deleteGroup(room)}
                        >
                          <Icon name="trash" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <div className={`exhibits ${listLike ? "glass" : ""}`}>
                  {room.links.map((l) => exhibit(l, ++counter))}
                </div>
              </section>
            );
          })
        )}
      </main>

      {selected.size > 0 && (
        <div className="bulk">
          <span>已選 {selected.size} 件</span>
          <select
            value=""
            aria-label="移到展區"
            onChange={async (e) => {
              let id = e.target.value;
              if (!id) return;
              if (id === "__new") {
                const name = prompt("新展區名稱");
                const g = name?.trim() ? await createGroup(name.trim()) : null;
                if (!g) return;
                id = g.id;
              }
              moveLinks([...selected], id);
            }}
          >
            <option value="">移到展區…</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
            <option value="__new">＋ 新展區…</option>
          </select>
          <button
            className="text-btn"
            onClick={() =>
              openAll(links.filter((l) => selected.has(l.id)).map((l) => l.url))
            }
          >
            開啟
          </button>
          <button
            className="text-btn"
            onClick={() => deleteLinks([...selected])}
          >
            刪除
          </button>
          <button className="text-btn" onClick={() => setSelected(new Set())}>
            取消選取
          </button>
        </div>
      )}

      {toast && (
        <div className="toast" role="status">
          <span>{toast.text}</span>
          {toast.undo && <button onClick={undo}>復原</button>}
        </div>
      )}
    </div>
  );
}
