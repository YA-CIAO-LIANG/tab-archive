import type { Metadata } from "next";
import { CaptureInbox } from "./CaptureInbox";

export const metadata: Metadata = { title: "收藏中" };

/**
 * Where captured tabs arrive: the extension opens /app/capture#tabs=…, and
 * Android's share sheet opens /app/capture?url=…. The page writes them to
 * the signed-in account, then goes to the archive.
 */
export default function CapturePage() {
  return <CaptureInbox />;
}
