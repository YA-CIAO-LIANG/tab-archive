"use client";

import Link from "next/link";
import { useUser } from "@/lib/useUser";

/** Top bar for the public pages. */
export function Nav() {
  const signedIn = !!useUser();
  return (
    <nav className="site-nav glass">
      <div className="wrap">
        <Link href="/" className="brand">
          <img src="/icon.svg" alt="" />
          網頁集合器
        </Link>
        <span className="spacer" />
        <a
          className="text-btn"
          href="https://github.com/YA-CIAO-LIANG/tab-archive"
        >
          GitHub
        </a>
        {signedIn ? (
          <Link className="btn primary" href="/app">
            進入典藏
          </Link>
        ) : (
          <Link className="btn" href="/login">
            登入
          </Link>
        )}
      </div>
    </nav>
  );
}
