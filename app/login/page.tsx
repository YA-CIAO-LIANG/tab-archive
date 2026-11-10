import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "登入" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return (
    <>
      <Nav />
      <LoginForm next={next ?? "/app"} />
    </>
  );
}
