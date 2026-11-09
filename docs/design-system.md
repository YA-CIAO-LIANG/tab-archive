# 設計系統：美術館風格

清冷、乾淨、簡約、自律。所有 token 定義在 `app/globals.css` 的 `:root`。

- **色彩**：紙 `--paper #eef1f1`、墨 `--ink #1b2126`、次墨 `--ink-2`、灰 `--muted`、唯一強調色 `--accent #3b5566`；細線 `--line`／`--line-soft`。分頁群組顏色降低彩度後只用在 8px 色塊。
- **字體**：標題 Noto Serif TC（中）＋Cormorant Garamond（拉丁、編號）；內文 Noto Sans TC 300/400/500。小標用全大寫＋字距 0.2em 以上（`.eyebrow`）。
- **形狀**：圓角 2px（`--radius`）、1px 細線、少陰影。
- **玻璃**：`.glass`，白 55%＋blur 22px＋白邊＋極淡外框。鯨魚在玻璃底下。
- **元件**：`.btn`（主要按鈕 `.primary` 實心墨色）、`.text-btn`（底線式）、`.icon-btn`、`.field`（只有底線的輸入框）、`.notice`。
- **展區**：`.room`，編號（Cormorant 300）＋名稱（宋體）＋件數。
- **陳列方式**：`.v-list`、`.v-compact`、`.v-medium`、`.v-large`、`.v-icons`、`.v-gallery`。
- **觸控**：`@media (hover: none)` 時，懸停才出現的控制項一律顯示。
