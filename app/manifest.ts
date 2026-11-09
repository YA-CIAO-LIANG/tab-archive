import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "網頁集合器 Tab Archive",
    short_name: "網頁集合器",
    description: "把瀏覽器分頁收進雲端典藏，電腦、手機、平板都找得到。",
    start_url: "/app",
    display: "standalone",
    background_color: "#eef1f1",
    theme_color: "#eef1f1",
    lang: "zh-Hant",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    // Android: "Share → 網頁集合器" adds the page to the archive.
    share_target: {
      action: "/app/share",
      method: "GET",
      params: { title: "title", text: "text", url: "url" },
    },
  } as MetadataRoute.Manifest;
}
