import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getUser } from "@/auth/server";
import { Archive } from "@/components/Archive";

export const metadata: Metadata = { title: "我的典藏" };

export default async function AppPage() {
  const user = await getUser();
  if (!user) redirect("/login?next=/app");
  return <Archive email={user.email ?? ""} />;
}
