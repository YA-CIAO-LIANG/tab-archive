"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { RequireUser } from "@/components/RequireUser";
import {
  incomingFromLocation,
  planCapture,
  type Incoming,
} from "@/lib/capture";
import { firebase } from "@/lib/firebase";
import { firestoreStore } from "@/lib/store";

const KEY = "tab-archive:pending";

function Importer({ uid }: { uid: string }) {
  const router = useRouter();
  const started = useRef(false);
  const [text, setText] = useState("收藏中…");

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    let raw: string | null = null;
    try {
      raw = sessionStorage.getItem(KEY);
    } catch {}
    const fb = firebase();
    if (!raw || !fb) {
      router.replace("/app");
      return;
    }
    const store = firestoreStore(fb.db, uid);
    (async () => {
      try {
        const plan = planCapture(
          await store.read(),
          JSON.parse(raw) as Incoming,
        );
        await store.write(plan.ops);
        try {
          sessionStorage.removeItem(KEY);
        } catch {}
        setText(
          `新增 ${plan.added} 個連結` +
            (plan.grouped ? `（${plan.grouped} 個依分頁群組分類）` : "") +
            (plan.dup ? `，重複略過 ${plan.dup} 個` : "") +
            "。",
        );
        setTimeout(() => router.replace("/app"), 1600);
      } catch {
        setText("收藏失敗，請重新整理這一頁再試一次。");
      }
    })();
  }, [uid, router]);

  return (
    <main className="wrap">
      <div className="stack" style={{ paddingTop: 140, textAlign: "center" }}>
        <p className="lede" role="status">
          {text}
        </p>
        <p>
          <Link className="btn" href="/app">
            進入典藏
          </Link>
        </p>
      </div>
    </main>
  );
}

export function CaptureInbox() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const incoming = incomingFromLocation(
      window.location.hash,
      window.location.search,
    );
    if (incoming) {
      try {
        sessionStorage.setItem(KEY, JSON.stringify(incoming));
      } catch {}
      // Keep the tab list out of history and out of the login redirect.
      history.replaceState(null, "", window.location.pathname);
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReady(true);
  }, []);
  if (!ready) return null;
  return <RequireUser render={(user) => <Importer uid={user.uid} />} />;
}
