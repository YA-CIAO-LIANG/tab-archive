import type { Metadata } from "next";
import { AccountView } from "./AccountTools";

export const metadata: Metadata = { title: "帳號" };

export default function AccountPage() {
  return <AccountView />;
}
