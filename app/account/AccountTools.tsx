"use client";

import { deleteUser, signOut, type User } from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Nav } from "@/components/Nav";
import { RequireUser } from "@/components/RequireUser";
import { planCapture, type IncomingTab } from "@/lib/capture";
import { firebase } from "@/lib/firebase";
import { firestoreStore, type Op } from "@/lib/store";

type ImportGroup = { id?: string; name?: string; color?: string };
type ImportLink = IncomingTab & { group?: string; group_id?: string };

export function AccountView() {
  return (
    <RequireUser
      render={(user) => (
        <>
          <Nav />
          <main className="wrap">
            <div className="stack">
              <div>
                <div className="eyebrow">Account</div>
                <h1 className="display" style={{ fontSize: 40 }}>
                  帳號
                </h1>
                <p className="lede">{user.email}</p>
              </div>
              <AccountTools user={user} />
            </div>
          </main>
        </>
      )}
    />
  );
}

function AccountTools({ user }: { user: User }) {
  const router = useRouter();
  const [message, setMessage] = useState<{
    text: string;
    error?: boolean;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const site = typeof window === "undefined" ? "" : window.location.origin;
  const store = () => firestoreStore(firebase()!.db, user.uid);

  async function exportData() {
    const { groups, links } = await store().read();
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
      const rooms = new Map(
        data.groups.map((g) => [g.id ?? "", { name: g.name, color: g.color }]),
      );
      const s = store();
      const plan = planCapture(await s.read(), {
        inbox: "收件匣",
        tabs: data.links.map((l) => {
          const room = rooms.get(l.group_id ?? l.group ?? "");
          return { ...l, group: room?.name ?? "", color: room?.color };
        }),
      });
      await s.write(plan.ops);
      setMessage({
        text: `匯入完成：新增 ${plan.added} 個連結，重複略過 ${plan.dup} 個。`,
      });
    } catch {
      setMessage({ text: "匯入失敗：檔案格式不正確。", error: true });
    }
    setBusy(false);
  }

  async function logout() {
    await signOut(firebase()!.auth);
    router.push("/");
  }

  async function deleteAccount() {
    if (!confirm("刪除帳號會永久刪除所有展區與連結，無法復原。確定嗎？"))
      return;
    if (prompt("請輸入「刪除」確認") !== "刪除") return;
    try {
      const s = store();
      const { groups, links } = await s.read();
      await s.write([
        ...links.map((l): Op => ({ type: "delete", col: "links", id: l.id })),
        ...groups.map((g): Op => ({ type: "delete", col: "groups", id: g.id })),
      ]);
      await deleteUser(user);
      router.push("/");
    } catch (err) {
      const recent =
        err instanceof FirebaseError &&
        err.code === "auth/requires-recent-login";
      setMessage({
        text: recent
          ? "為了安全，請先登出再重新登入，然後再刪除一次帳號。"
          : "刪除失敗，請稍後再試。",
        error: true,
      });
    }
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
          <li>
            點擴充功能圖示，按「收藏所有分頁」。預設會存到{" "}
            <span className="token">{site}</span>
            ，自架的話可以在擴充功能的「設定」改網址。
          </li>
        </ol>
        <p>之後按「收藏所有分頁」，分頁會送到這個網站，存進你登入的帳號。</p>
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
          <button className="btn" onClick={logout}>
            登出
          </button>
          <button className="btn danger" onClick={deleteAccount}>
            刪除帳號與所有資料
          </button>
        </div>
      </section>
    </>
  );
}
