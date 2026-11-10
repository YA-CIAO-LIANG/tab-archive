"use client";

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";

/**
 * Animated, per-platform walkthrough of bringing all open tabs in without
 * installing anything. Each step is a small looping scene drawn in HTML/CSS;
 * the steps advance by themselves (unless reduced motion is on) and can be
 * clicked.
 */

export type Platform = "mac" | "windows" | "iphone" | "android";
const PLATFORMS: { id: Platform; label: string }[] = [
  { id: "mac", label: "Mac" },
  { id: "windows", label: "Windows" },
  { id: "iphone", label: "iPhone / iPad" },
  { id: "android", label: "Android" },
];
const STEP_MS = 3600;

export function detectPlatform(ua: string, touchMac = false): Platform {
  if (/Android/i.test(ua)) return "android";
  if (/iPhone|iPad|iPod/i.test(ua) || touchMac) return "iphone";
  if (/Windows|CrOS|Linux/i.test(ua)) return "windows";
  return "mac";
}

const d = (s: number) => ({ "--d": `${s}s` }) as CSSProperties;
const Keys = ({
  keys,
  at,
  out,
}: {
  keys: string[];
  at: number;
  out?: number;
}) => (
  <div
    className={`g-keys ${out ? "g-out" : ""}`}
    style={out ? d(out) : undefined}
  >
    {keys.map((k, i) => (
      <kbd key={k} className="g-press" style={d(at + i * 0.15)}>
        {k}
      </kbd>
    ))}
  </div>
);
const Tap = ({
  x,
  y,
  at,
  hold,
}: {
  x: string;
  y: string;
  at: number;
  hold?: boolean;
}) => (
  <span
    className={hold ? "g-hold" : "g-tap"}
    style={{ left: x, top: y, ...d(at) }}
  />
);
const Chip = ({ at, children }: { at: number; children: ReactNode }) => (
  <div className="g-chip g-in" style={d(at)}>
    {children}
  </div>
);
const Lines = ({ n = 3 }: { n?: number }) => (
  <div className="g-lines">
    {Array.from({ length: n }, (_, i) => (
      <i key={i} style={{ width: `${90 - i * 17}%` }} />
    ))}
  </div>
);
const Cards = ({ at, n = 5 }: { at: number; n?: number }) => (
  <div className="g-cards">
    {Array.from({ length: n }, (_, i) => (
      <div key={i} className="g-card g-in" style={d(at + i * 0.09)}>
        <i className="g-fav" />
        <span>
          <b style={{ width: `${70 - (i % 3) * 12}%` }} />
          <em style={{ width: `${88 - (i % 2) * 20}%` }} />
        </span>
      </div>
    ))}
  </div>
);

// ------------------------------------------------------------- desktop
function Window({
  os,
  title,
  tabs = 5,
  closing,
  children,
}: {
  os: "mac" | "windows";
  title?: string;
  tabs?: number;
  closing?: number;
  children: ReactNode;
}) {
  return (
    <div className="g-win">
      <div className="g-bar">
        {os === "mac" && (
          <span className="g-dots">
            <i />
            <i />
            <i />
          </span>
        )}
        <div className="g-tabstrip">
          {title ? (
            <span className="g-tab on">
              <i className="g-fav" />
              {title}
            </span>
          ) : (
            Array.from({ length: tabs }, (_, i) => (
              <span
                key={i}
                className={`g-tab ${i === 0 ? "on" : ""} ${closing !== undefined && i > 0 ? "g-shrink" : ""}`}
                style={
                  closing !== undefined
                    ? d(closing + (tabs - i) * 0.22)
                    : undefined
                }
              >
                <i className="g-fav" />
                <em />
              </span>
            ))
          )}
        </div>
        {os === "windows" && <span className="g-wctl">—　▢　✕</span>}
      </div>
      <div className="g-url">
        <span />
      </div>
      <div className="g-page">{children}</div>
    </div>
  );
}

function DesktopSave({ os }: { os: "mac" | "windows" }) {
  const mod = os === "mac" ? "⌘" : "Ctrl";
  return (
    <>
      <Window os={os}>
        <Lines n={4} />
      </Window>
      <Keys
        keys={[mod, os === "mac" ? "⇧" : "Shift", "D"]}
        at={0.3}
        out={1.1}
      />
      <div
        className="g-pop g-in g-then-out"
        style={{ ...d(1), "--o": "2.3s" } as CSSProperties}
      >
        <b>將所有分頁加入書籤</b>
        <span className="g-field">名稱　所有分頁</span>
        <span className="g-btns">
          <span>取消</span>
          <span className="g-primary g-pulse" style={d(1.8)}>
            儲存
          </span>
        </span>
      </div>
      <Chip at={2.5}>✓ 已存成書籤資料夾</Chip>
    </>
  );
}

function DesktopCopy({ os }: { os: "mac" | "windows" }) {
  const mod = os === "mac" ? "⌘" : "Ctrl";
  return (
    <>
      <Window os={os} title="書籤">
        <div className="g-manager">
          <div className="g-side">
            <span>書籤列</span>
            <span className="g-sel" style={d(0.4)}>
              所有分頁
            </span>
            <span>其他書籤</span>
          </div>
          <div className="g-list">
            {Array.from({ length: 5 }, (_, i) => (
              <span key={i} className="g-sel" style={d(1.15 + i * 0.06)}>
                <i className="g-fav" />
                <em style={{ width: `${68 - (i % 3) * 14}%` }} />
              </span>
            ))}
          </div>
        </div>
      </Window>
      <Keys
        keys={[mod, os === "mac" ? "⌥" : "Shift", os === "mac" ? "B" : "O"]}
        at={0}
        out={0.7}
      />
      <Keys keys={[mod, "A"]} at={0.85} out={1.6} />
      <Keys keys={[mod, "C"]} at={1.75} out={2.6} />
      <Chip at={2.3}>✓ 已複製 5 個網址</Chip>
    </>
  );
}

function ArchivePage({ at }: { at: number }) {
  return (
    <div className="g-archive">
      <b className="g-serif">我的典藏</b>
      <Cards at={at} />
    </div>
  );
}

function DesktopPaste({ os }: { os: "mac" | "windows" }) {
  const mod = os === "mac" ? "⌘" : "Ctrl";
  return (
    <>
      <Window os={os} title="網頁集合器">
        <ArchivePage at={2.1} />
      </Window>
      <Keys keys={[mod, "V"]} at={0.3} out={1} />
      <div
        className="g-pop g-in g-then-out"
        style={{ ...d(0.8), "--o": "1.9s" } as CSSProperties}
      >
        <b>匯入所有分頁</b>
        <span className="g-muted">找到 5 個網址</span>
        <span className="g-btns">
          <span className="g-primary g-pulse" style={d(1.4)}>
            匯入 5 個連結
          </span>
        </span>
      </div>
    </>
  );
}

function DesktopClose({ os }: { os: "mac" | "windows" }) {
  return (
    <>
      <Window os={os} closing={0.2}>
        <ArchivePage at={0} />
      </Window>
      <Chip at={1.6}>瀏覽器變輕了</Chip>
    </>
  );
}

// --------------------------------------------------------------- phone
function Phone({ children }: { children: ReactNode }) {
  return (
    <div className="g-phone">
      <div className="g-screen">{children}</div>
    </div>
  );
}
const Thumbs = ({ checks }: { checks?: number }) => (
  <div className="g-thumbs">
    {Array.from({ length: 6 }, (_, i) => (
      <span key={i}>
        <i />
        <Lines n={2} />
        {checks !== undefined && (
          <b className="g-check g-in" style={d(checks + i * 0.08)}>
            ✓
          </b>
        )}
      </span>
    ))}
  </div>
);

function PhoneOpen({ os }: { os: "iphone" | "android" }) {
  return (
    <>
      <Phone>
        {os === "android" ? (
          <div className="g-mtop">
            <span className="g-murl" />
            <span className="g-count">5</span>
            <span className="g-kebab">⋮</span>
          </div>
        ) : null}
        <div className="g-mpage">
          <Lines n={6} />
        </div>
        {os === "iphone" && (
          <div className="g-mbar">
            <span>‹</span>
            <span>›</span>
            <span>⇪</span>
            <span>▢</span>
            <span className="g-squares" />
          </div>
        )}
        <div className="g-overlay g-in" style={d(1.1)}>
          <Thumbs />
          {os === "iphone" && (
            <div className="g-mfoot">
              <span>＋</span>
              <span>5 個分頁 ⌄</span>
              <span>完成</span>
            </div>
          )}
        </div>
      </Phone>
      {os === "iphone" ? (
        <Tap x="59.4%" y="87.7%" at={0.5} />
      ) : (
        <Tap x="56.3%" y="14.5%" at={0.5} />
      )}
    </>
  );
}

function PhoneCopy({ os }: { os: "iphone" | "android" }) {
  if (os === "iphone") {
    return (
      <>
        <Phone>
          <div className="g-overlay">
            <Thumbs />
            <div className="g-mfoot">
              <span>＋</span>
              <span>5 個分頁 ⌄</span>
              <span>完成</span>
            </div>
          </div>
          <div className="g-menu g-in" style={d(1.3)}>
            <span>新增空白分頁群組</span>
            <span className="g-hl" style={d(1.9)}>
              拷貝連結
            </span>
            <span>關閉所有分頁</span>
          </div>
        </Phone>
        <Tap x="48.7%" y="87.2%" at={0.3} hold />
        <Chip at={2.4}>✓ 已拷貝 5 個連結</Chip>
      </>
    );
  }
  return (
    <>
      <Phone>
        <div className="g-mtop">
          <span className="g-murl" />
          <span className="g-count">5</span>
          <span className="g-kebab">⋮</span>
        </div>
        <div className="g-overlay">
          <Thumbs checks={1.2} />
        </div>
        <div
          className="g-menu top g-in g-then-out"
          style={{ ...d(0.5), "--o": "1.1s" } as CSSProperties}
        >
          <span>新增分頁</span>
          <span className="g-hl" style={d(0.85)}>
            選取分頁
          </span>
          <span>設定</span>
        </div>
        <div className="g-sheet g-in" style={d(2)}>
          <span className="g-hl" style={d(2.4)}>
            複製
          </span>
          <span>Gmail</span>
          <span>雲端硬碟</span>
        </div>
      </Phone>
      <Tap x="59.9%" y="14.5%" at={0.25} />
      <Chip at={2.7}>✓ 已複製 5 個連結</Chip>
    </>
  );
}

function PhonePaste() {
  return (
    <>
      <Phone>
        <div className="g-mpage g-archive">
          <b className="g-serif">我的典藏</b>
          <span className="g-mbtn">匯入分頁</span>
          <Cards at={2.3} n={4} />
        </div>
        <div
          className="g-sheet tall g-in g-then-out"
          style={{ ...d(0.8), "--o": "2.1s" } as CSSProperties}
        >
          <b>匯入所有分頁</b>
          <span className="g-primary g-pulse" style={d(1.3)}>
            貼上剪貼簿
          </span>
          <span className="g-muted g-in" style={d(1.6)}>
            找到 5 個網址
          </span>
        </div>
      </Phone>
      <Tap x="45%" y="25.7%" at={0.35} />
    </>
  );
}

// --------------------------------------------------------------- steps
type Step = { title: string; text: ReactNode; scene: ReactNode };

function steps(p: Platform): Step[] {
  if (p === "mac" || p === "windows") {
    const mac = p === "mac";
    const K = ({ k }: { k: string }) => (
      <>
        {k.split(" ").map((x) => (
          <kbd key={x}>{x}</kbd>
        ))}
      </>
    );
    return [
      {
        title: "存成書籤",
        text: (
          <>
            按 <K k={mac ? "⌘ ⇧ D" : "Ctrl Shift D"} />
            ，所有分頁存成一個書籤資料夾，按「儲存」。
          </>
        ),
        scene: <DesktopSave os={p} />,
      },
      {
        title: "全選、複製",
        text: (
          <>
            按 <K k={mac ? "⌘ ⌥ B" : "Ctrl Shift O"} />{" "}
            開書籤管理員，點進資料夾，
            <K k={mac ? "⌘ A" : "Ctrl A"} /> 全選、
            <K k={mac ? "⌘ C" : "Ctrl C"} /> 複製。
          </>
        ),
        scene: <DesktopCopy os={p} />,
      },
      {
        title: "貼上",
        text: (
          <>
            在網頁集合器按 <K k={mac ? "⌘ V" : "Ctrl V"} />
            ，確認匯入。
          </>
        ),
        scene: <DesktopPaste os={p} />,
      },
      {
        title: "關掉分頁",
        text: "收好了，放心關掉分頁，瀏覽器立刻變輕。",
        scene: <DesktopClose os={p} />,
      },
    ];
  }
  const iphone = p === "iphone";
  return [
    {
      title: "打開分頁總覽",
      text: iphone
        ? "在 Safari 點右下角的分頁按鈕。"
        : "在 Chrome 點右上角的分頁數字。",
      scene: <PhoneOpen os={p} />,
    },
    {
      title: iphone ? "拷貝連結" : "選取並複製",
      text: iphone
        ? "長按下方的「N 個分頁」，選「拷貝連結」。"
        : "點 ⋮ →「選取分頁」，全選後按分享 →「複製」。",
      scene: <PhoneCopy os={p} />,
    },
    {
      title: "貼上",
      text: "在網頁集合器點「匯入分頁」→「貼上剪貼簿」。",
      scene: <PhonePaste />,
    },
  ];
}

export function ImportGuide({ compact }: { compact?: boolean }) {
  const [platform, setPlatform] = useState<Platform>("mac");
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(true);
  const list = steps(platform);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPlatform(
      detectPlatform(
        navigator.userAgent,
        /Mac/.test(navigator.userAgent) && navigator.maxTouchPoints > 1,
      ),
    );
    if (matchMedia("(prefers-reduced-motion: reduce)").matches)
      setPlaying(false);
  }, []);

  useEffect(() => {
    if (!playing) return;
    const t = setTimeout(() => setStep((s) => (s + 1) % list.length), STEP_MS);
    return () => clearTimeout(t);
  }, [step, playing, list.length, platform]);

  return (
    <div className={`guide ${compact ? "compact" : ""}`}>
      <div className="guide-tabs" role="tablist" aria-label="選擇裝置">
        {PLATFORMS.map((p) => (
          <button
            key={p.id}
            type="button"
            role="tab"
            aria-selected={platform === p.id}
            className={platform === p.id ? "on" : ""}
            onClick={() => {
              setPlatform(p.id);
              setStep(0);
            }}
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="guide-body">
        <div className="g-stage" key={`${platform}-${step}`} aria-hidden="true">
          {list[step].scene}
        </div>
        <ol className="guide-steps">
          {list.map((s, i) => (
            <li key={`${platform}-${i}`} className={i === step ? "on" : ""}>
              <button
                type="button"
                onClick={() => {
                  setStep(i);
                  setPlaying(false);
                }}
              >
                <span className="no">{i + 1}</span>
                <span className="txt">
                  <b>{s.title}</b>
                  <small>{s.text}</small>
                </span>
              </button>
              {i === step && playing && (
                <span
                  className="g-progress"
                  style={{ animationDuration: `${STEP_MS}ms` }}
                />
              )}
            </li>
          ))}
        </ol>
      </div>
      {!playing && (
        <button
          type="button"
          className="text-btn guide-play"
          onClick={() => setPlaying(true)}
        >
          ▶ 自動播放
        </button>
      )}
    </div>
  );
}
