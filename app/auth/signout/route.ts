import { NextResponse, type NextRequest } from "next/server";
import { getServerSupabase } from "@/auth/server";

export async function POST(request: NextRequest) {
  const supabase = await getServerSupabase();
  await supabase?.auth.signOut();
  return NextResponse.redirect(new URL("/", request.nextUrl.origin), {
    status: 303,
  });
}
