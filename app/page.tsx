import Link from "next/link";
import { Icon } from "@/components/Icons";
import { Nav } from "@/components/Nav";

const FEATURES = [
  {
    icon: "capture",
    title: "一次收進所有分頁",
    text: "不用安裝任何東西：用瀏覽器內建的「將所有分頁加入書籤」，複製、貼上，幾百個分頁一次收好，放心關掉。",
  },
  {
    icon: "folder",
    title: "自動分類成展區",
    text: "每次匯入自成一個展區，書籤資料夾變成同名展區。想連分頁群組和顏色都保留，可加裝選用的擴充功能。",
  },
  {
    icon: "gallery",
    title: "六種陳列方式",
    text: "列表、精簡、中圖、大圖、圖示牆、展覽。找東西用精簡，回顧用大圖與展覽。",
  },
  {
    icon: "text",
    title: "自動附上網頁介紹",
    text: "抓取每個網頁的標題、摘要、預覽圖與高解析度圖示，不必點開也知道是什麼。",
  },
  {
    icon: "phone",
    title: "電腦、手機、平板同步",
    text: "登入同一個帳號就看得到。手機可以加到主畫面，像 App 一樣使用。",
  },
  {
    icon: "lock",
    title: "只屬於你",
    text: "每個帳號的資料彼此隔離（資料庫安全規則）。可隨時匯出，或刪除帳號與所有資料。",
  },
];

export default function Home() {
  return (
    <>
      <Nav />
      <main className="wrap">
        <section className="hero">
          <div className="eyebrow">Tab Archive — 分頁典藏館</div>
          <h1 className="display">
            把分頁收進展櫃，
            <br />
            讓瀏覽器重新呼吸。
          </h1>
          <p className="lede">
            分頁開太多，瀏覽器就卡。網頁集合器把開著的分頁收進一座安靜的典藏館：依分頁群組分類、附上網頁介紹與圖示、隨時搜尋，在電腦、手機、平板都找得到。
          </p>
          <div className="actions">
            <Link className="btn primary large" href="/app">
              免費開始使用
            </Link>
            <Link className="btn large" href="/demo">
              先看展示
            </Link>
            <a className="btn large" href="#how">
              如何使用
            </a>
          </div>
        </section>

        <section className="section">
          <div className="section-head">
            <span className="no">I</span>
            <h2>館藏特色</h2>
          </div>
          <div className="features glass">
            {FEATURES.map((f) => (
              <div className="feature" key={f.title}>
                <Icon name={f.icon} />
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="section" id="how">
          <div className="section-head">
            <span className="no">II</span>
            <h2>如何使用</h2>
          </div>
          <ol className="steps">
            <li>
              <div>
                <b>用 Google 或 Email 註冊</b>
                <span>建立帳號只要幾秒鐘。</span>
              </div>
            </li>
            <li>
              <div>
                <b>把所有分頁存成書籤，複製</b>
                <span>
                  用瀏覽器內建的「將所有分頁加入書籤」（⌘⇧D），再到書籤管理員全選、複製。不用安裝任何東西。
                </span>
              </div>
            </li>
            <li>
              <div>
                <b>貼到網頁集合器</b>
                <span>
                  在典藏頁按
                  ⌘V，網址一次全部收進來，自動抓取網頁介紹與圖示。收好就能放心關掉分頁，瀏覽器立刻變輕。
                </span>
              </div>
            </li>
            <li>
              <div>
                <b>在任何裝置瀏覽與整理</b>
                <span>
                  搜尋、加筆記與標籤、拖曳到別的展區。手機上也能直接新增連結。
                </span>
              </div>
            </li>
          </ol>
        </section>

        <footer className="footer">
          網頁集合器 Tab Archive · 開放原始碼 ·{" "}
          <a href="https://github.com/YA-CIAO-LIANG/tab-archive">GitHub</a>
          <br />
          背景鯨魚：<i>Balaenoptera musculus</i>，NOAA Fisheries
          圖版，公有領域。
        </footer>
      </main>
    </>
  );
}
