# 網頁集合器 Tab Archive

把瀏覽器開著的分頁收進一座安靜的雲端典藏館。分頁開太多，瀏覽器就卡：一鍵收藏、順手關掉，之後在電腦、手機、平板都找得到。

**網站：https://tab-archive.vercel.app** （[先看展示](https://tab-archive.vercel.app/demo)，不用註冊）

![首頁](docs/screenshots/landing.jpg)

## 功能

- **一鍵收藏所有分頁**：Brave／Chrome／Edge 擴充功能，收藏後可自動關閉分頁（釘選分頁保留）。
- **依分頁群組自動分類**：瀏覽器的分頁群組變成同名「展區」，保留顏色；沒分組的進收件匣。
- **六種陳列方式**：列表、精簡、中圖、大圖、圖示牆、展覽。
- **網頁介紹與大圖示**：自動抓取每個網頁的標題、摘要、預覽圖與高解析度圖示。
- **整理**：搜尋、筆記、標籤、拖曳換展區、批次移動／開啟／刪除、復原（⌘Z）。
- **帳號**：Google 登入或 Email＋密碼註冊（含忘記密碼）。資料存在雲端，各帳號互相隔離。
- **手機與平板**：響應式版面，可「加到主畫面」當 App 用；Android 可從「分享」直接加入連結。
- **匯出／匯入 JSON**，可隨時刪除帳號與所有資料。

| 大圖                                     | 展覽                                       |
| ---------------------------------------- | ------------------------------------------ |
| ![大圖](docs/screenshots/demo-large.jpg) | ![展覽](docs/screenshots/demo-gallery.jpg) |
| **列表**                                 | **圖示牆**                                 |
| ![列表](docs/screenshots/demo-list.jpg)  | ![圖示牆](docs/screenshots/demo-icons.jpg) |

## 技術架構

| 部分         | 技術                                                         |
| ------------ | ------------------------------------------------------------ |
| 網站         | Next.js 16（App Router）、React 19、TypeScript               |
| 帳號與資料庫 | Firebase（Auth：Google、Email；Firestore＋安全規則）免費方案 |
| 部署         | Vercel 免費方案                                              |
| 擴充功能     | Chrome Manifest V3（`extension/`）                           |

擴充功能不用金鑰：它把分頁清單放在網址的 `#` 後面，開啟網站的 `/app/capture`；網頁讀取後寫進你在網站登入的帳號。`#` 後面的內容不會傳到伺服器。

## 本機開發

```bash
npm install
npm run dev                  # http://localhost:3000，展示頁在 /demo
```

Firebase 的網頁設定（公開值）寫在 `lib/firebase-config.ts`，不需要環境變數。

檢查：`npm run lint && npm run format:check && npm run typecheck && npm test && npm run build`

## 自行架設

1. 在 [Firebase 主控台](https://console.firebase.google.com) 建立專案（免費 Spark 方案），新增一個網頁應用程式，把設定值填進 `lib/firebase-config.ts`。
2. Authentication → 登入方式：開啟「電子郵件/密碼」與「Google」。設定 → 授權網域：加上你的網址。
3. 建立 Firestore 資料庫，部署安全規則：`npx firebase-tools deploy --only firestore:rules --project <專案 ID>`。
4. 在 Vercel 匯入此 repo，直接部署。

## 安裝擴充功能

1. 到網站「帳號」頁下載擴充功能壓縮檔並解壓縮（或直接用本 repo 的 `extension/` 資料夾）。
2. 開 `brave://extensions`（或 `chrome://extensions`），開啟「開發人員模式」→「載入未封裝項目」→ 選資料夾。
3. 點擴充功能圖示，按「收藏所有分頁」（預設存到 https://tab-archive.vercel.app ）。快捷鍵：`Alt+Shift+S`。

## 隱私

- 每個帳號只讀寫得到自己的資料（`firestore.rules`）。
- 「網頁介紹」由伺服器抓取該網頁的 `<head>`（只抓公開網址，擋內部網路位址）。
- 沒有網站自帶圖示時，會向 Google 的 favicon 服務查詢該網域的圖示。

## 授權與出處

程式碼：MIT。背景鯨魚：_Balaenoptera musculus_，NOAA Fisheries 圖版，公有領域（[Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Balaenoptera_musculus_NOAA.jpg)）。
