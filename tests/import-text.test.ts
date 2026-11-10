import { describe, expect, it } from "vitest";
import { parseLinks } from "@/lib/import-text";

describe("parseLinks", () => {
  it("reads one URL per line, as the bookmark manager copies them", () => {
    expect(
      parseLinks("https://a.example/\r\nhttps://b.example/x?y=1\n\n"),
    ).toEqual([
      { url: "https://a.example/", title: "" },
      { url: "https://b.example/x?y=1", title: "" },
    ]);
  });

  it("finds URLs inside text, keeps a title, drops trailing punctuation and repeats", () => {
    expect(
      parseLinks(
        "看這個 https://a.example/page。\nMy Site - https://b.example/\nhttps://a.example/page",
      ),
    ).toEqual([
      { url: "https://a.example/page", title: "看這個" },
      { url: "https://b.example/", title: "My Site" },
    ]);
  });

  it("reads Markdown links", () => {
    expect(
      parseLinks("- [Docs](https://d.example/) and [x](https://e.example)"),
    ).toEqual([
      { url: "https://d.example/", title: "Docs" },
      { url: "https://e.example", title: "x" },
    ]);
  });

  it("turns bookmark-export folders into rooms", () => {
    const html = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<DL><p>
  <DT><H3>書籤列</H3>
  <DL><p>
    <DT><H3>研究 &amp; 筆記</H3>
    <DL><p>
      <DT><A HREF="https://a.example/?q=1&amp;r=2" ADD_DATE="1">A &lt;page&gt;</A>
    </DL><p>
    <DT><A HREF="https://b.example/">B</A>
    <DT><A HREF="javascript:alert(1)">bad</A>
  </DL><p>
</DL>`;
    expect(parseLinks(html)).toEqual([
      {
        url: "https://a.example/?q=1&r=2",
        title: "A <page>",
        group: "研究 & 筆記",
      },
      { url: "https://b.example/", title: "B", group: "書籤列" },
    ]);
  });

  it("prefers copied HTML (it carries titles)", () => {
    expect(
      parseLinks(
        "https://a.example/",
        '<meta charset="utf-8"><a href="https://a.example/">Alpha</a>',
      ),
    ).toEqual([{ url: "https://a.example/", title: "Alpha", group: "" }]);
  });

  it("returns nothing for text without links", () => {
    expect(parseLinks("hello world")).toEqual([]);
  });
});
