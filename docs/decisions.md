# 決策紀錄

## D1 · 2026-11-09 · 架構沿用 ListenLoop

Next.js 16＋Supabase（Auth、Postgres＋RLS）＋Vercel。理由：Joe 已熟悉這套流程，Google 登入與 Email 註冊 Supabase 都內建。改架構看 `auth/`、`lib/supabase/`。

## D2 · 2026-11-09 · 用擴充功能收分頁

雲端網站讀不到使用者電腦裡的分頁，所以用 Manifest V3 擴充功能（`tabs`、`tabGroups`、`storage` 權限）。分頁群組原生可讀，不必再解析 Brave session 檔。本機 Python 版留在上層資料夾，不再維護。

## D3 · 2026-11-09 · 收藏金鑰

擴充功能沒有網站 cookie。帳號頁產生 `tab_` 開頭的隨機金鑰，資料庫只存 SHA-256；`capture_tabs`（security definer）驗證後寫入。`/api/capture` 只對 `chrome-extension://`、`moz-extension://` 來源開 CORS。看 `supabase/migrations/`、`app/api/capture/route.ts`。

## D4 · 2026-11-09 · 圖片用 `<img>` 而非 next/image

預覽圖與圖示來自任何網域，next/image 需要逐一允許網域。ESLint 關掉 `no-img-element`。

## D5 · 2026-11-09 · 網頁介紹在網站端抓取

登入使用者的瀏覽器呼叫 `/api/meta`，伺服器抓網頁 `<head>`（只允許公開 IP、最多 3 次轉址、6 秒、512 KB），結果寫回該使用者自己的資料列。抓過一次就記 `meta_fetched_at`，不自動重試；編輯表單可手動重抓。看 `app/api/meta/route.ts`、`lib/meta.ts`、`lib/ssrf.ts`。

## D6 · 2026-11-09 · 圖示來源順序

網站宣告的最大圖示（apple-touch-icon 優先）→ Google favicon 服務（sz=128）→ 網域首字。

## D7 · 2026-11-09 · 鯨魚背景

NOAA 藍鯨圖版（公有領域），在瀏覽器 canvas 轉成透明 PNG（依亮度算透明度），純 CSS 動畫，可用「鯨魚：靜止」或 prefers-reduced-motion 停止。

## D8 · 2026-11-09 · 展示頁

`/demo` 用同一個元件、公開網站的範例資料，變更只存在頁面裡（`memoryStore`）。

## D9 · 2026-11-09 · 改用 Firebase（取代 D1 的 Supabase、D3 的收藏金鑰）

Supabase 免費方案最多 2 個專案，Joe 已用滿；Joe 選擇改用 Google 的 Firebase。Firebase 免費方案沒有專案數量限制，也不會因為沒人用而暫停；Google 登入一鍵開啟。

- 資料：Firestore `users/{uid}/groups`、`users/{uid}/links`，規則見 `firestore.rules`。頁面用即時訂閱，其他裝置的變更自動出現。看 `lib/store.ts`。
- 登入：全在瀏覽器（`lib/useUser.ts`、`components/RequireUser.tsx`），沒有伺服器 session；重設密碼用 Firebase 內建頁面。
- 擴充功能不再用金鑰：分頁清單放在 `/app/capture#tabs=…`，由已登入的網頁寫入（`lib/capture.ts`）。Android 分享也走同一頁。
- `/api/meta` 用 `jose` 驗證 Firebase ID token，不需要服務帳號金鑰。
- 網站仍放在 Vercel；Firebase Hosting 跑 Next.js 需要付費方案。

## D10 · 2026-11-09 · 不用安裝也能匯入分頁

Joe：操作太複雜，不要讓使用者安裝東西。網頁本身讀不到分頁（瀏覽器安全限制），所以主要流程改成瀏覽器內建的「將所有分頁加入書籤」（⌘⇧D）→ 書籤管理員全選複製 → 在典藏頁貼上。典藏頁任何地方貼上多個網址都會開匯入視窗；也接受書籤匯出檔（資料夾變展區）。擴充功能保留為選用（帳號頁收合）。看 `lib/import-text.ts`、`components/ImportDialog.tsx`。

## D11 · 2026-11-09 · 各裝置的動畫教學

Joe：要有手機版和 Mac、Windows 版的指引動畫。`components/ImportGuide.tsx` 用 HTML／CSS 畫出示意場景（不用影片或 GIF，檔案小、隨主題縮放），依 User-Agent 自動選 Mac、Windows、iPhone/iPad、Android，可手動切換；步驟自動播放，`prefers-reduced-motion` 時停在最後畫面。出現在首頁「如何使用」與匯入視窗。手機版另有「貼上剪貼簿」按鈕。iPhone（Safari「拷貝連結」）與 Android（Chrome「選取分頁 → 分享 → 複製」）的步驟沒有在實機上驗證。
