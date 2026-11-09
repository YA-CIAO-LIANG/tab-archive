import type { Metadata } from "next";
import { Archive } from "@/components/Archive";
import { DEMO_GROUPS, DEMO_LINKS } from "@/lib/demo";

export const metadata: Metadata = {
  title: "展示",
  description: "不用註冊，先看看網頁集合器的六種陳列方式。",
};

/** Public demo: the real archive UI with sample data, changes stay local. */
export default function DemoPage() {
  return <Archive email="" demo={{ groups: DEMO_GROUPS, links: DEMO_LINKS }} />;
}
