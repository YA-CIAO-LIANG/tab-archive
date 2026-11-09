import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSupabase } from "@/auth/server";
import { Nav } from "@/components/Nav";
import { AccountTools } from "./AccountTools";

export const metadata: Metadata = { title: "帳號" };

export default async function AccountPage() {
  const supabase = await getServerSupabase();
  const { data } = (await supabase?.auth.getUser()) ?? { data: { user: null } };
  if (!supabase || !data.user) redirect("/login?next=/account");
  const { data: token } = await supabase
    .from("capture_tokens")
    .select("created_at, last_used_at")
    .maybeSingle();
  return (
    <>
      <Nav signedIn />
      <main className="wrap">
        <div className="stack">
          <div>
            <div className="eyebrow">Account</div>
            <h1 className="display" style={{ fontSize: 40 }}>
              帳號
            </h1>
            <p className="lede">{data.user.email}</p>
          </div>
          <AccountTools
            hasToken={!!token}
            tokenCreated={token?.created_at ?? null}
            tokenUsed={token?.last_used_at ?? null}
          />
        </div>
      </main>
    </>
  );
}
