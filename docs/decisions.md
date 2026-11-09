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

`/demo` 用同一個元件、公開網站的範例資料，變更只存在頁面裡（離線用的假 Supabase client）。
