// Tab Archive extension: hands the open tabs (with their tab groups) to the
// site's /app/capture page in the URL fragment. The page saves them to the
// account signed in there, so the extension needs no key, and the fragment
// never reaches a server.
const $ = (id) => document.getElementById(id);
const COLOR_NAMES = {
  grey: "灰",
  blue: "藍",
  red: "紅",
  yellow: "黃",
  green: "綠",
  pink: "粉",
  purple: "紫",
  cyan: "青",
  orange: "橘",
};
const DEFAULT_SITE = "https://tab-archive.vercel.app";
let settings = {};

const origin = (value) => {
  try {
    const u = new URL(value.trim());
    return u.protocol === "https:" || u.hostname === "localhost"
      ? u.origin
      : null;
  } catch {
    return null;
  }
};

async function tabsToSend() {
  const query = $("onlyWindow").checked ? { currentWindow: true } : {};
  const tabs = await chrome.tabs.query(query);
  return tabs.filter(
    (t) => /^https?:\/\//.test(t.url || "") && !t.url.startsWith(settings.site),
  );
}

async function refreshCount() {
  const tabs = await tabsToSend();
  $("count").innerHTML =
    `${tabs.length} 個分頁<small>${$("onlyWindow").checked ? "這個視窗" : "所有視窗"}</small>`;
}

function show(which) {
  $("main").hidden = which !== "main";
  $("setup").hidden = which !== "setup";
}

async function init() {
  settings = await chrome.storage.local.get(["site", "close", "onlyWindow"]);
  settings.site = settings.site || DEFAULT_SITE;
  $("site").value = settings.site || "";
  $("close").checked = !!settings.close;
  $("onlyWindow").checked = !!settings.onlyWindow;
  if (!settings.site) return show("setup");
  show("main");
  refreshCount();
}

$("save").addEventListener("click", async () => {
  const site = origin($("site").value);
  if (!site)
    return ($("setupMsg").textContent = "網站網址需要是 https:// 開頭");
  await chrome.storage.local.set({ site });
  init();
});
$("settings").addEventListener("click", (e) => {
  e.preventDefault();
  show("setup");
});
$("open").addEventListener("click", (e) => {
  e.preventDefault();
  chrome.tabs.create({ url: `${settings.site}/app` });
});
$("close").addEventListener("change", (e) =>
  chrome.storage.local.set({ close: e.target.checked }),
);
$("onlyWindow").addEventListener("change", (e) => {
  chrome.storage.local.set({ onlyWindow: e.target.checked });
  refreshCount();
});

$("capture").addEventListener("click", async () => {
  const btn = $("capture");
  const msg = $("msg");
  btn.disabled = true;
  btn.textContent = "收藏中…";
  msg.className = "msg";
  msg.textContent = "";
  try {
    const tabs = await tabsToSend();
    const groups = {};
    for (const id of new Set(
      tabs.map((t) => t.groupId).filter((id) => id >= 0),
    )) {
      try {
        const g = await chrome.tabGroups.get(id);
        groups[id] = {
          title: g.title || `未命名群組（${COLOR_NAMES[g.color] || g.color}）`,
          color: g.color,
        };
      } catch {
        // Group closed meanwhile: treat its tabs as ungrouped.
      }
    }
    const now = new Date();
    const p = (n) => String(n).padStart(2, "0");
    const inbox = `收件匣 ${p(now.getMonth() + 1)}/${p(now.getDate())} ${p(now.getHours())}:${p(now.getMinutes())}`;
    const payload = {
      inbox,
      tabs: tabs.map((t) => ({
        url: t.url,
        title: (t.title || "").slice(0, 300),
        icon: (t.favIconUrl || "").startsWith("https://")
          ? t.favIconUrl.slice(0, 500)
          : "",
        group: groups[t.groupId]?.title || "",
        color: groups[t.groupId]?.color || "",
      })),
    };
    const url = `${settings.site}/app/capture#tabs=${encodeURIComponent(JSON.stringify(payload))}`;
    // Open the archive first so the window never ends up empty.
    const opened = await chrome.tabs.create({ url });
    if ($("close").checked) {
      const ids = tabs
        .filter((t) => !t.pinned && t.id !== opened.id)
        .map((t) => t.id);
      if (ids.length) await chrome.tabs.remove(ids);
    }
    msg.textContent = `已送出 ${tabs.length} 個分頁。`;
  } catch (err) {
    msg.className = "msg error";
    msg.textContent = err.message || "收藏失敗";
  }
  btn.disabled = false;
  btn.textContent = "收藏所有分頁";
});

init();
