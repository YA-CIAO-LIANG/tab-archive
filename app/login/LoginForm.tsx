"use client";

import { useState } from "react";
import { loadBrowserSupabase } from "@/lib/supabase/browser";
import { safeNextPath } from "@/lib/redirect";

type Mode = "signin" | "signup" | "forgot";

const ERRORS: Record<string, string> = {
  "Invalid login credentials": "Email 或密碼不正確。",
  "Email not confirmed": "這個 Email 還沒驗證，請先點信中的確認連結。",
  "User already registered": "這個 Email 已經註冊過，請直接登入。",
};

export function LoginForm({ failed, next }: { failed: boolean; next: string }) {
  const [mode, setMode] = useState<Mode>("signin");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    error?: boolean;
  } | null>(
    failed ? { text: "登入沒有完成，請再試一次。", error: true } : null,
  );

  const callback = () => {
    const url = new URL("/auth/callback", window.location.origin);
    url.searchParams.set("next", safeNextPath(next));
    return url.href;
  };

  async function google() {
    setBusy(true);
    const supabase = await loadBrowserSupabase();
    if (!supabase)
      return setMessage({ text: "網站尚未設定登入服務。", error: true });
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callback() },
    });
    if (error) {
      setBusy(false);
      setMessage({ text: "無法開始 Google 登入，請稍後再試。", error: true });
    }
  }

  async function submit(form: FormData) {
    const email = String(form.get("email") ?? "")
      .trim()
      .toLowerCase();
    const password = String(form.get("password") ?? "");
    setBusy(true);
    setMessage(null);
    const supabase = await loadBrowserSupabase();
    if (!supabase) {
      setBusy(false);
      return setMessage({ text: "網站尚未設定登入服務。", error: true });
    }
    if (mode === "forgot") {
      const redirectTo = new URL(
        "/auth/callback?next=/login/reset",
        window.location.origin,
      ).href;
      await supabase.auth.resetPasswordForEmail(email, { redirectTo });
      setBusy(false);
      // Same answer whether or not the address has an account.
      return setMessage({
        text: "如果這個 Email 有註冊，重設密碼的信已經寄出。",
      });
    }
    if (password.length < 8) {
      setBusy(false);
      return setMessage({ text: "密碼至少要 8 個字元。", error: true });
    }
    const { data, error } =
      mode === "signup"
        ? await supabase.auth.signUp({
            email,
            password,
            options: { emailRedirectTo: callback() },
          })
        : await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      return setMessage({
        text: ERRORS[error.message] ?? error.message,
        error: true,
      });
    }
    if (mode === "signup" && !data.session) {
      return setMessage({
        text: "註冊成功！請到信箱點確認連結，完成後就能登入。",
      });
    }
    window.location.assign(safeNextPath(next));
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
