import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getUser } from "@/auth/server";
import { Nav } from "@/components/Nav";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "登入" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  if (await getUser()) redirect("/app");
  const { error, next } = await searchParams;
  return (
    <>
      <Nav signedIn={false} />
      <LoginForm failed={error === "failed"} next={next ?? "/app"} />
    </>
  );
}
