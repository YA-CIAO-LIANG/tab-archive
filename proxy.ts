import type { NextRequest } from "next/server";
import { updateSession } from "@/auth/proxy-session";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Pages only: skip build assets, the extension API, and files with an extension.
  matcher: ["/((?!_next/static|_next/image|api/capture|.*\\.[a-zA-Z0-9]+$).*)"],
};
