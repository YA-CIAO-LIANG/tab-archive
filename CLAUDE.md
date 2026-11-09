# 網頁集合器 Tab Archive

把瀏覽器分頁收進雲端典藏。架構與工作方式沿用 ListenLoop（Next.js 16＋Supabase＋Vercel）。

- GitHub：https://github.com/YA-CIAO-LIANG/tab-archive
- 程式碼與註解用英文；跟 Joe 溝通用繁體中文。
- 推送前本機五項檢查都要過：lint、format:check、typecheck、test、build。
- UI 遵守 `docs/design-system.md`；規格未定義的細節自行決定，記在 `docs/decisions.md`。
- 改資料庫：在 `supabase/migrations/` 新增檔案，不改舊的 migration。
- 改了 `extension/` 之後，重新打包：`zip -qr public/tab-archive-extension.zip extension -x "*.DS_Store"`。
- 只有需要 Joe 本人操作的事才停下來問（建立帳號或專案、憑證、需要信用卡的服務）。
