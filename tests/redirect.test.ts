import { describe, expect, it } from "vitest";
import { safeNextPath } from "@/lib/redirect";

describe("safeNextPath", () => {
  it("keeps local paths", () =>
    expect(safeNextPath("/account?x=1")).toBe("/account?x=1"));
  it.each([
    "//evil.example",
    "/\\evil.example",
    "https://evil.example",
    "",
    null,
  ])("rejects %s", (v) => expect(safeNextPath(v)).toBe("/app"));
});
