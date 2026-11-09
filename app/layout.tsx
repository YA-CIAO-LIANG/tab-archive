import type { Metadata, Viewport } from "next";
import {
  Cormorant_Garamond,
  Noto_Sans_TC,
  Noto_Serif_TC,
} from "next/font/google";
import { Icons } from "@/components/Icons";
import { Sea } from "@/components/Sea";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
});
// CJK fonts are split by unicode-range; preloading them would fetch too much.
const serifTc = Noto_Serif_TC({
  weight: ["400", "500"],
  variable: "--font-serif-tc",
  preload: false,
});
const sansTc = Noto_Sans_TC({
  weight: ["300", "400", "500"],
  variable: "--font-sans-tc",
  preload: false,
});

export const metadata: Metadata = {
  title: { default: "網頁集合器 Tab Archive", template: "%s · 網頁集合器" },
  description:
    "一鍵把瀏覽器開著的分頁收進雲端典藏，依分頁群組自動分類。關掉分頁，瀏覽器不再卡頓；電腦、手機、平板隨時找得到。",
  applicationName: "網頁集合器",
  appleWebApp: {
    capable: true,
    title: "網頁集合器",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#eef1f1",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="zh-Hant"
      className={`${cormorant.variable} ${serifTc.variable} ${sansTc.variable}`}
    >
      <body>
        <Icons />
        <Sea />
        <div className="page">{children}</div>
      </body>
    </html>
  );
}
