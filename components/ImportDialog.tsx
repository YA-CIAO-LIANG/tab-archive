"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { IncomingTab } from "@/lib/capture";
import { parseLinks } from "@/lib/import-text";

export type Pasted = { text: string; html: string };

const pad = (n: number) => String(n).padStart(2, "0");
const defaultRoom = () => {
  const d = new Date();
  return `匯入 ${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/**
 * Bring in all open tabs without installing anything: the browser's own
 * "bookmark all tabs", copy in the bookmark manager, paste here. A bookmarks
 * export file works too (its folders become rooms).
 */
export function ImportDialog({
  initial,
  onClose,
  onImport,
}: {
  initial: Pasted | null;
  onClose: () => void;
  onImport: (tabs: IncomingTab[], room: string) => Promise<void>;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [pasted, setPasted] = useState<Pasted>(
    initial ?? { text: "", html: "" },
  );
  const [room, setRoom] = useState(defaultRoom);
  const [busy, setBusy] = useState(false);
  const [mac, setMac] = useState(true);
  const [touch, setTouch] = useState(false);
  const tabs = useMemo(() => parseLinks(pasted.text, pasted.html), [pasted]);
  const foldered = tabs.some((t) => t.group);

  useEffect(() => {
    ref.current?.showModal();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMac(/Mac/.test(navigator.userAgent));
    setTouch(matchMedia("(hover: none)").matches);
  }, []);

  const k = (macKeys: string, winKeys: string) =>
    (mac ? macKeys : winKeys)
      .split(" ")
      .map((key) => <kbd key={key}>{key}</kbd>);

  async function readFile(file: File) {
    const text = await file.text();
    setPasted({ text, html: "" });
  }

  return (
    <dialog
      ref={ref}
      className="import-dialog"
      onClose={onClose}
      onClick={(e) => e.target === ref.current && ref.current?.close()}
      aria-labelledby="import-title"
    >
      <form
        method="dialog"
        className="panel glass"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!tabs.length) return;
          setBusy(true);
          await onImport(tabs, room.trim() || defaultRoom());
          setBusy(false);
          ref.current?.close();
        }}
      >
        <div className="import-head">
          <div>
            <div className="eyebrow">Import</div>
            <h2 id="import-title">匯入所有分頁</h2>
          </div>
          <button
            type="button"
            className="text-btn"
            onClick={() => ref.current?.close()}
            aria-label="關閉"
          >
            關閉
          </button>
        </div>

        {touch ? (
          <p className="import-hint">
            把網址貼在下面，一行一個。電腦上可以一次匯入所有分頁。
          </p>
        ) : (
          <>
            <ol className="import-steps">
              <li>
                按 {k("⌘ ⇧ D", "Ctrl Shift D")}
                ，瀏覽器會把所有分頁存成一個書籤資料夾，按「儲存」。
              </li>
              <li>
                按 {k("⌘ ⌥ B", "Ctrl Shift O")}
                打開書籤管理員，點進剛剛的資料夾，按 {k("⌘ A", "Ctrl A")}
                全選、{k("⌘ C", "Ctrl C")}複製。
              </li>
              <li>回到這裡，在下面的框按 {k("⌘ V", "Ctrl V")} 貼上。</li>
            </ol>
            <p className="import-hint">
              Safari：在側邊欄的分頁群組上按右鍵
              →「拷貝連結」。手機上可以直接貼上網址，一行一個。
            </p>
          </>
        )}

        <textarea
          className="import-box"
          value={pasted.text}
          placeholder={"在這裡貼上\nhttps://…\nhttps://…"}
          aria-label="貼上網址"
          onPaste={(e) => {
            const html = e.clipboardData.getData("text/html");
            const text = e.clipboardData.getData("text/plain");
            if (html || text) {
              e.preventDefault();
              setPasted({ text, html });
            }
          }}
          onChange={(e) => setPasted({ text: e.target.value, html: "" })}
        />

        <div className="import-meta">
          <span className="import-count">
            {tabs.length
              ? `找到 ${tabs.length} 個網址${foldered ? "，資料夾會變成展區" : ""}`
              : "還沒有網址"}
          </span>
          <label className="text-btn">
            或選擇書籤匯出檔（.html）
            <input
              type="file"
              accept=".html,.htm,text/html,.txt,text/plain"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) readFile(f);
                e.target.value = "";
              }}
            />
          </label>
        </div>

        <label className="field">
          {foldered ? "沒有資料夾的放進" : "放進展區"}
          <input value={room} onChange={(e) => setRoom(e.target.value)} />
        </label>

        <div className="row-actions">
          <button className="btn primary large" disabled={!tabs.length || busy}>
            {busy
              ? "匯入中…"
              : tabs.length
                ? `匯入 ${tabs.length} 個連結`
                : "匯入"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
