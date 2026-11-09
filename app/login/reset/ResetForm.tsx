"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { loadBrowserSupabase } from "@/lib/supabase/browser";

export function ResetForm() {
  const router = useRouter();
  const [message, setMessage] = useState<{
    text: string;
    error?: boolean;
  } | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(form: FormData) {
    const password = String(form.get("password") ?? "");
    if (password.length < 8)
      return setMessage({ text: "密碼至少要 8 個字元。", error: true });
    setBusy(true);
    const supabase = await loadBrowserSupabase();
    const result = await supabase?.auth.updateUser({ password });
    setBusy(false);
    if (!result || result.error)
      return setMessage({ text: "沒有成功，請重新申請重設信。", error: true });
    router.push("/app");
    router.refresh();
  }

  return (
    <main className="auth glass">
      <h1>設定新密碼</h1>
      <form action={submit} style={{ display: "grid", gap: 18 }}>
        <label className="field">
          新密碼
          <input
            name="password"
            type="password"
            minLength={8}
            autoComplete="new-password"
            required
          />
        </label>
        <button className="btn primary large" disabled={busy}>
          儲存新密碼
        </button>
      </form>
      {message && (
        <p className={`notice ${message.error ? "error" : ""}`}>
          {message.text}
        </p>
      )}
    </main>
  );
}
