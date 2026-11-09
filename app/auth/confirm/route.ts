import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { getServerSupabase } from "@/auth/server";
import { safeNextPath } from "@/lib/redirect";

const TYPES: readonly EmailOtpType[] = [
  "signup",
  "recovery",
  "email",
  "magiclink",
];

/**
 * Where email links land when the templates use token_hash (works on any
 * device, unlike the code flow): confirming an address or a password reset.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next =
    type === "recovery"
      ? "/login/reset"
      : safeNextPath(searchParams.get("next"));
  const supabase = await getServerSupabase();
  if (!tokenHash || !type || !TYPES.includes(type) || !supabase) {
    return NextResponse.redirect(new URL("/login?error=failed", origin));
  }
  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type,
  });
  if (error)
    return NextResponse.redirect(new URL("/login?error=failed", origin));
  return NextResponse.redirect(new URL(next, origin));
}
