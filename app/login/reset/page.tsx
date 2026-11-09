import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getUser } from "@/auth/server";
import { Nav } from "@/components/Nav";
import { ResetForm } from "./ResetForm";

export const metadata: Metadata = { title: "設定新密碼" };

export default async function ResetPage() {
  // The reset link signs the person in first (callback/confirm route).
  if (!(await getUser())) redirect("/login?error=failed");
  return (
    <>
      <Nav signedIn />
      <ResetForm />
    </>
  );
}
