import { describe, expect, it } from "vitest";
import { parseMeta } from "@/lib/meta";

describe("parseMeta", () => {
  it("prefers Open Graph and resolves relative URLs", () => {
    const html = `<html><head><title>Plain</title>
      <meta property="og:title" content="OG &amp; Title">
      <meta name="description" content="Plain description">
      <meta property="og:description" content="OG description">
      <meta property="og:image" content="/cover.png">
      <link rel="icon" href="/favicon-32.png" sizes="32x32">
      <link rel="apple-touch-icon" href="/apple.png">
    </head></html>`;
    expect(parseMeta(html, "https://example.com/a/b")).toEqual({
      title: "OG & Title",
      description: "OG description",
      image: "https://example.com/cover.png",
      icon: "https://example.com/apple.png",
    });
  });

  it("falls back to <title>, meta description, and /favicon.ico", () => {
    const html = `<title> Hello   world </title><meta content='Desc' name='description'>`;
    expect(parseMeta(html, "https://x.org/p")).toEqual({
      title: "Hello world",
      description: "Desc",
      image: null,
      icon: "https://x.org/favicon.ico",
    });
  });

  it("drops non-http image URLs", () => {
    const html = `<meta property="og:image" content="javascript:alert(1)">`;
    expect(parseMeta(html, "https://x.org").image).toBeNull();
  });
});
