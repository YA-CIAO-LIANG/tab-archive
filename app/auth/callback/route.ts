import { NextResponse, type NextRequest } from "next/server";
import { getServerSupabase } from "@/auth/server";
import { safeNextPath } from "@/lib/redirect";

/**
 * Where Google sign-in (and the default email links) return through
 * Supabase: swaps the one-time code for a session cookie.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const next = safeNextPath(searchParams.get("next"));
  const code = searchParams.get("code");
  const supabase = await getServerSupabase();
  if (searchParams.get("error") || !code || !supabase) {
    return NextResponse.redirect(new URL("/login?error=failed", origin));
  }
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error)
    return NextResponse.redirect(new URL("/login?error=failed", origin));
  return NextResponse.redirect(new URL(next, origin));
}
