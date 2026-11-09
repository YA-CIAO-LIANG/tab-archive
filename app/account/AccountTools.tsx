"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { loadBrowserSupabase } from "@/lib/supabase/browser";

const date = (v: string | null) =>
  v ? new Date(v).toLocaleString("zh-TW") : "—";

type ImportGroup = {
  id?: string;
  name?: string;
  color?: string;
  collapsed?: boolean;
};
type ImportLink = {
  url?: string;
  title?: string;
  note?: string;
  tags?: string[];
  group?: string;
  group_id?: string;
  description?: string;
};

export function AccountTools({
  hasToken,
  tokenCreated,
  tokenUsed,
}: {
  hasToken: boolean;
  tokenCreated: string | null;
  tokenUsed: string | null;
}) {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [message, setMessage] = useState<{
    text: string;
    error?: boolean;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const site = typeof window === "undefined" ? "" : window.location.origin;

  async function newToken() {
    if (hasToken && !confirm("產生新金鑰後，舊金鑰會立即失效。確定嗎？"))
      return;
    const supabase = await loadBrowserSupabase();
    const { data, error } = (await supabase?.rpc("create_capture_token")) ?? {};
    if (error || !data)
      return setMessage({ text: "產生金鑰失敗", error: true });
    setToken(data as string);
  }

  async function exportData() {
    const supabase = await loadBrowserSupabase();
    if (!supabase) return;
    const [{ data: groups }, { data: links }] = await Promise.all([
      supabase
        .from("groups")
        .select("id, name, color, position, collapsed")
        .order("position"),
      supabase
        .from("links")
        .select(
          "group_id, url, title, note, tags, description, image, icon, created_at",
        )
        .order("position"),
    ]);
    const blob = new Blob(
      [JSON.stringify({ version: 1, groups, links }, null, 1)],
      { type: "application/json" },
    );
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `tab-archive-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  }

  /** Imports this site's export, or the local Python version's data.json. */
  async function importData(file: File) {
    setBusy(true);
    setMessage(null);
    try {
      const data = JSON.parse(await file.text()) as {
        groups?: ImportGroup[];
        links?: ImportLink[];
      };
      if (!Array.isArray(data.groups) || !Array.isArray(data.links))
        throw new Error("format");
      const supabase = await loadBrowserSupabase();
      if (!supabase) throw new Error("config");
      const { data: existing } = await supabase
        .from("groups")
        .select("id, name");
      const byName = new Map(
        (existing ?? []).map((g) => [g.name as string, g.id as string]),
      );
      const idMap = new Map<string, string>();
      let position = -Date.now() / 1000;
      for (const g of data.groups) {
        const name = String(g.name ?? "").slice(0, 120);
        if (!name) continue;
        let id = byName.get(name);
        if (!id) {
          const color =
            /^(grey|blue|red|yellow|green|pink|purple|cyan|orange)$/.test(
              g.color ?? "",
            )
              ? g.color
              : "none";
          const { data: row } = await supabase
            .from("groups")
            .insert({
              name,
              color,
              position: position++,
              collapsed: !!g.collapsed,
            })
            .select("id")
            .single();
          id = row?.id as string | undefined;
          if (id) byName.set(name, id);
        }
        if (id && g.id) idMap.set(g.id, id);
      }
      const rows = data.links
        .filter((l) => typeof l.url === "string" && /^https?:\/\//.test(l.url))
        .map((l, i) => ({
          url: l.url!.slice(0, 4096),
          title: String(l.title ?? l.url).slice(0, 1000),
          note: String(l.note ?? "").slice(0, 4000),
          tags: Array.isArray(l.tags) ? l.tags.map(String).slice(0, 30) : [],
          description: String(l.description ?? "").slice(0, 2000),
          group_id: idMap.get(l.group_id ?? l.group ?? "") ?? null,
          position: Date.now() / 1000 + i / 10000,
        }));
      let added = 0;
      for (let i = 0; i < rows.length; i += 500) {
        const { data: inserted, error } = await supabase
          .from("links")
          .upsert(rows.slice(i, i + 500), {
            onConflict: "user_id,url",
            ignoreDuplicates: true,
          })
          .select("id");
        if (error) throw error;
        added += inserted?.length ?? 0;
      }
      setMessage({ text: `匯入完成：新增 ${added} 個連結（重複的已略過）。` });
    } catch {
      setMessage({ text: "匯入失敗：檔案格式不正確。", error: true });
    }
    setBusy(false);
  }

  async function deleteAccount() {
    if (!confirm("刪除帳號會永久刪除所有展區與連結，無法復原。確定嗎？"))
      return;
    if (prompt("請輸入「刪除」確認") !== "刪除") return;
    const supabase = await loadBrowserSupabase();
    const { error } = (await supabase?.rpc("delete_own_account")) ?? {};
    if (error)
      return setMessage({ text: "刪除失敗，請稍後再試。", error: true });
    await supabase?.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <>
      {message && (
        <p className={`notice ${message.error ? "error" : ""}`}>
          {message.text}
        </p>
      )}

      <section className="panel glass">
        <h2>瀏覽器擴充功能</h2>
        <p>
          支援 Brave、Chrome、Edge 等 Chromium
          瀏覽器。一鍵收藏所有分頁，分頁群組自動變成展區。
        </p>
        <ol
          style={{
            margin: 0,
            paddingLeft: 20,
            color: "var(--ink-2)",
            display: "grid",
            gap: 6,
          }}
        >
          <li>
            下載 <a href="/tab-archive-extension.zip">擴充功能壓縮檔</a>{" "}
            並解壓縮。
          </li>
          <li>
            在網址列輸入 <code>brave://extensions</code>（Chrome 是{" "}
            <code>chrome://extensions</code>），打開右上角「開發人員模式」。
          </li>
          <li>按「載入未封裝項目」，選擇解壓縮後的資料夾。</li>
          <li>點擴充功能圖示，貼上下面的「網站網址」與「收藏金鑰」。</li>
        </ol>
        <p>
          網站網址：<span className="token">{site}</span>
        </p>
        <div className="row-actions">
          <button className="btn primary" onClick={newToken}>
            {hasToken || token ? "重新產生收藏金鑰" : "產生收藏金鑰"}
          </button>
        </div>
        {token ? (
          <>
            <p>這是你的收藏金鑰，只會顯示這一次，請現在複製到擴充功能：</p>
            <div className="token">{token}</div>
            <div className="row-actions">
              <button
                className="btn"
                onClick={() => navigator.clipboard.writeText(token)}
              >
                複製金鑰
              </button>
            </div>
          </>
        ) : (
          hasToken && (
            <p>
              目前的金鑰建立於 {date(tokenCreated)}，最後使用 {date(tokenUsed)}
              。
            </p>
          )
        )}
      </section>

      <section className="panel glass">
        <h2>匯出與匯入</h2>
        <p>
          把所有展區與連結下載成 JSON 備份；也可以匯入備份，或本機版網頁集合器的
          data.json。
        </p>
        <div className="row-actions">
          <button className="btn" onClick={exportData}>
            匯出 JSON
          </button>
          <label className="btn">
            {busy ? "匯入中…" : "匯入 JSON"}
            <input
              type="file"
              accept=".json,application/json"
              hidden
              disabled={busy}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) importData(f);
                e.target.value = "";
              }}
            />
          </label>
        </div>
      </section>

      <section className="panel glass">
        <h2>登出與刪除</h2>
        <div className="row-actions">
          <form action="/auth/signout" method="post">
            <button className="btn">登出</button>
          </form>
          <button className="btn danger" onClick={deleteAccount}>
            刪除帳號與所有資料
          </button>
        </div>
      </section>
    </>
  );
}
