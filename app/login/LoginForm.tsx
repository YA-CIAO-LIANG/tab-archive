"use client";

import { FirebaseError } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { firebase } from "@/lib/firebase";
import { safeNextPath } from "@/lib/redirect";
import { useUser } from "@/lib/useUser";

type Mode = "signin" | "signup" | "forgot";

const ERRORS: Record<string, string> = {
  "auth/invalid-credential": "Email 或密碼不正確。",
  "auth/wrong-password": "Email 或密碼不正確。",
  "auth/user-not-found": "Email 或密碼不正確。",
  "auth/invalid-email": "Email 格式不正確。",
  "auth/email-already-in-use": "這個 Email 已經註冊過，請直接登入。",
  "auth/weak-password": "密碼太簡單，請換一個。",
  "auth/too-many-requests": "嘗試太多次了，請稍後再試。",
  "auth/popup-blocked": "瀏覽器擋下了登入視窗，請允許彈出式視窗後再試。",
  "auth/network-request-failed": "網路連線失敗，請稍後再試。",
  "auth/unauthorized-domain": "這個網址還沒加入登入服務的允許清單。",
  "auth/operation-not-allowed": "這種登入方式還沒啟用。",
};
const QUIET = new Set([
  "auth/popup-closed-by-user",
  "auth/cancelled-popup-request",
]);

export function LoginForm({ next }: { next: string }) {
  const router = useRouter();
  const user = useUser();
  const [mode, setMode] = useState<Mode>("signin");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    error?: boolean;
  } | null>(null);

  useEffect(() => {
    if (user) router.replace(safeNextPath(next));
  }, [user, next, router]);

  const fail = (err: unknown) => {
    setBusy(false);
    const code = err instanceof FirebaseError ? err.code : "";
    if (QUIET.has(code)) return;
    setMessage({
      text: ERRORS[code] ?? "登入沒有完成，請再試一次。",
      error: true,
    });
  };

  async function google() {
    const fb = firebase();
    if (!fb) return setMessage({ text: "網站尚未設定登入服務。", error: true });
    setBusy(true);
    setMessage(null);
    try {
      await signInWithPopup(fb.auth, new GoogleAuthProvider());
    } catch (err) {
      fail(err);
    }
  }

  async function submit(form: FormData) {
    const fb = firebase();
    if (!fb) return setMessage({ text: "網站尚未設定登入服務。", error: true });
    const email = String(form.get("email") ?? "")
      .trim()
      .toLowerCase();
    const password = String(form.get("password") ?? "");
    setBusy(true);
    setMessage(null);
    try {
      if (mode === "forgot") {
        await sendPasswordResetEmail(fb.auth, email).catch((err) => {
          // Same answer whether or not the address has an account.
          if (
            err instanceof FirebaseError &&
            err.code !== "auth/user-not-found"
          )
            throw err;
        });
        setBusy(false);
        return setMessage({
          text: "如果這個 Email 有註冊，重設密碼的信已經寄出。",
        });
      }
      if (password.length < 8) {
        setBusy(false);
        return setMessage({ text: "密碼至少要 8 個字元。", error: true });
      }
      if (mode === "signup")
        await createUserWithEmailAndPassword(fb.auth, email, password);
      else await signInWithEmailAndPassword(fb.auth, email, password);
      // The effect above moves on once Firebase reports the user.
    } catch (err) {
      fail(err);
    }
  }

  return (
    <main className="auth glass">
      <div>
        <div className="eyebrow">Tab Archive</div>
        <h1>
          {mode === "signup"
            ? "建立帳號"
            : mode === "forgot"
              ? "忘記密碼"
              : "登入典藏"}
        </h1>
      </div>

      {mode !== "forgot" && (
        <>
          <button
            className="btn large google-btn"
            onClick={google}
            disabled={busy}
          >
            <img src="/google.svg" alt="" />
            使用 Google 帳號{mode === "signup" ? "註冊" : "登入"}
          </button>
          <div className="divider">或</div>
        </>
      )}

      <form action={submit} style={{ display: "grid", gap: 18 }}>
        <label className="field">
          Email
          <input name="email" type="email" autoComplete="email" required />
        </label>
        {mode !== "forgot" && (
          <label className="field">
            密碼
            <input
              name="password"
              type="password"
              minLength={8}
              autoComplete={
                mode === "signup" ? "new-password" : "current-password"
              }
              required
            />
          </label>
        )}
        <button className="btn primary large" disabled={busy}>
          {busy
            ? "處理中…"
            : mode === "signup"
              ? "註冊"
              : mode === "forgot"
                ? "寄送重設信"
                : "登入"}
        </button>
      </form>

      {message && (
        <p className={`notice ${message.error ? "error" : ""}`} role="status">
          {message.text}
        </p>
      )}

      <div className="tabs">
        {mode !== "signin" && (
          <button className="text-btn" onClick={() => setMode("signin")}>
            已有帳號？登入
          </button>
        )}
        {mode !== "signup" && (
          <button className="text-btn" onClick={() => setMode("signup")}>
            還沒有帳號？註冊
          </button>
        )}
        {mode === "signin" && (
          <button className="text-btn" onClick={() => setMode("forgot")}>
            忘記密碼
          </button>
        )}
      </div>
    </main>
  );
}
