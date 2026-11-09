import { NextResponse, type NextRequest } from "next/server";
import { getServerSupabase } from "@/auth/server";

const INBOX = "收件匣";

/**
 * Android share target (manifest share_target): "Share → 網頁集合器" lands
 * here with the page's url, title and text. Apps often put the URL in the
 * text, so look there too.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const supabase = await getServerSupabase();
  const { data } = (await supabase?.auth.getUser()) ?? { data: { user: null } };
  if (!supabase || !data.user) {
    const back = `/app/share?${searchParams.toString()}`;
    return NextResponse.redirect(
      new URL(`/login?next=${encodeURIComponent(back)}`, origin),
    );
  }
  const candidates = [searchParams.get("url"), searchParams.get("text")]
    .join(" ")
    .match(/https?:\/\/[^\s]+/);
  if (candidates) {
    const url = candidates[0].slice(0, 4096);
    let { data: inbox } = await supabase
      .from("groups")
      .select("id")
      .eq("name", INBOX)
      .limit(1)
      .maybeSingle();
    if (!inbox) {
      ({ data: inbox } = await supabase
        .from("groups")
        .insert({ name: INBOX, position: -Date.now() / 1000 })
        .select("id")
        .single());
    }
    await supabase.from("links").upsert(
      {
        url,
        title: (searchParams.get("title") || url).slice(0, 1000),
        group_id: inbox?.id ?? null,
        position: Date.now() / 1000,
      },
      { onConflict: "user_id,url", ignoreDuplicates: true },
    );
  }
  return NextResponse.redirect(new URL("/app", origin));
}
