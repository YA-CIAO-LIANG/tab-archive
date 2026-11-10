import type { Metadata } from "next";
import { ArchiveGate } from "./ArchiveGate";

export const metadata: Metadata = { title: "我的典藏" };

export default function AppPage() {
  return <ArchiveGate />;
}
