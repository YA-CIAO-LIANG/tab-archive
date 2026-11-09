// Tab Archive extension: sends the open tabs (with their tab groups) to the
// site's /api/capture, signed with the account's capture token.
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
  settings = await chrome.storage.local.get([
    "site",
    "token",
    "close",
    "onlyWindow",
  ]);
  $("site").value = settings.site || "";
  $("token").value = settings.token || "";
  $("close").checked = !!settings.close;
  $("onlyWindow").checked = !!settings.onlyWindow;
  if (!settings.site || !settings.token) return show("setup");
  show("main");
  refreshCount();
}

$("save").addEventListener("click", async () => {
  const site = origin($("site").value);
  const token = $("token").value.trim();
  if (!site)
    return ($("setupMsg").textContent = "網站網址需要是 https:// 開頭");
  if (!token.startsWith("tab_"))
    return ($("setupMsg").textContent = "收藏金鑰應該以 tab_ 開頭");
  await chrome.storage.local.set({ site, token });
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
    const body = {
      inbox,
      tabs: tabs.map((t) => ({
        url: t.url,
        title: t.title || "",
        icon: (t.favIconUrl || "").startsWith("https://") ? t.favIconUrl : "",
        group: groups[t.groupId]?.title || "",
        color: groups[t.groupId]?.color || "",
      })),
    };
    const res = await fetch(`${settings.site}/api/capture`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${settings.token}`,
      },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401)
      throw new Error("收藏金鑰無效，請到網站「帳號」頁重新產生。");
    if (!res.ok) throw new Error("網站暫時無法收藏，請稍後再試。");
    msg.textContent = `新增 ${data.added} 個（${data.grouped} 個依分頁群組分類），重複略過 ${data.dup} 個。`;

    if ($("close").checked) {
      // Open the archive first so the window never ends up empty.
      await chrome.tabs.create({ url: `${settings.site}/app` });
      const ids = tabs.filter((t) => !t.pinned).map((t) => t.id);
      if (ids.length) await chrome.tabs.remove(ids);
    } else {
      refreshCount();
    }
  } catch (err) {
    msg.className = "msg error";
    msg.textContent = err.message || "收藏失敗";
  }
  btn.disabled = false;
  btn.textContent = "收藏所有分頁";
});

init();
