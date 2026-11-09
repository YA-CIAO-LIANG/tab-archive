import { describe, expect, it } from "vitest";
import { isPublicAddress } from "@/lib/ssrf";

describe("isPublicAddress", () => {
  it.each([
    "127.0.0.1",
    "10.1.2.3",
    "192.168.0.1",
    "172.20.0.1",
    "169.254.169.254",
    "::1",
    "fd00::1",
    "::ffff:127.0.0.1",
    "0.0.0.0",
    "nonsense",
  ])("blocks %s", (ip) => expect(isPublicAddress(ip)).toBe(false));
  it.each(["8.8.8.8", "142.250.1.1", "2606:4700::1111"])("allows %s", (ip) =>
    expect(isPublicAddress(ip)).toBe(true),
  );
});
