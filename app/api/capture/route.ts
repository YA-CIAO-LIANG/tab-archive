import { createClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseConfig } from "@/lib/supabase/config";

/**
 * The browser extension posts the open tabs here with the account's
 * capture token (no cookies: it runs on another origin). The database
 * function checks the token and saves the tabs (docs/decisions.md D3).
 */

const MAX_BODY = 2_000_000;

function cors(request: NextRequest) {
  const origin = request.headers.get("origin") ?? "";
  const allowed = /^(chrome-extension|moz-extension):\/\//.test(origin);
  return {
    ...(allowed ? { "Access-Control-Allow-Origin": origin } : {}),
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "content-type, authorization",
    Vary: "Origin",
  };
}

export function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 204, headers: cors(request) });
}

type Tab = {
  url?: unknown;
  title?: unknown;
  icon?: unknown;
  group?: unknown;
  color?: unknown;
};

export async function POST(request: NextRequest) {
  const headers = cors(request);
  const fail = (status: number, error: string) =>
    NextResponse.json({ error }, { status, headers });

  if (!supabaseConfig) return fail(503, "not_configured");
  if (Number(request.headers.get("content-length") ?? 0) > MAX_BODY) {
    return fail(413, "too_large");
  }
  const token = request.headers
    .get("authorization")
    ?.replace(/^Bearer\s+/i, "");
  let body: { tabs?: Tab[]; inbox?: unknown };
  try {
    body = await request.json();
  } catch {
    return fail(400, "bad_json");
  }
  if (!token) return fail(401, "no_token");
  if (!Array.isArray(body.tabs)) return fail(400, "no_tabs");

  const str = (v: unknown, max: number) =>
    typeof v === "string" ? v.slice(0, max) : "";
  const tabs = body.tabs.slice(0, 1000).map((t) => ({
    url: str(t.url, 4096),
    title: str(t.title, 1000),
    icon: str(t.icon, 4096),
    group: str(t.group, 120),
    color: str(t.color, 20),
  }));

  const supabase = createClient(
    supabaseConfig.url,
    supabaseConfig.publishableKey,
    {
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
  const { data, error } = await supabase.rpc("capture_tabs", {
    p_token: token,
    p_tabs: tabs,
    p_inbox: str(body.inbox, 120),
  });
  if (error) {
    return error.code === "28000"
      ? fail(401, "bad_token")
      : fail(500, "save_failed");
  }
  return NextResponse.json(data, { headers });
}
