import { describe, expect, it } from "vitest";
import { incomingFromLocation, planCapture } from "@/lib/capture";
import type { Group, Link } from "@/lib/types";

const group = (id: string, name: string): Group => ({
  id,
  name,
  color: "none",
  position: 0,
  collapsed: false,
});
const link = (url: string): Link => ({
  id: url,
  group_id: null,
  url,
  title: url,
  note: "",
  tags: [],
  description: "",
  image: null,
  icon: null,
  meta_fetched_at: null,
  position: 0,
  created_at: "",
});

describe("planCapture", () => {
  it("files tabs by tab group, reusing rooms with the same name", () => {
    const plan = planCapture(
      { groups: [group("g1", "工作")], links: [] },
      {
        inbox: "收件匣",
        tabs: [
          { url: "https://a.example/", group: "工作" },
          { url: "https://b.example/", group: "旅行", color: "blue" },
          { url: "https://c.example/" },
        ],
      },
    );
    expect(plan).toMatchObject({ added: 3, dup: 0, grouped: 2 });
    const rooms = plan.ops.filter((o) => o.col === "groups");
    expect(rooms.map((o) => o.type === "set" && o.doc)).toMatchObject([
      { name: "旅行", color: "blue" },
      { name: "收件匣", color: "none" },
    ]);
    const first = plan.ops.find(
      (o) =>
        o.type === "set" &&
        o.col === "links" &&
        o.doc.url === "https://a.example/",
    );
    expect(first?.type === "set" && first.doc).toMatchObject({
      group_id: "g1",
    });
  });

  it("skips duplicates, bad URLs and unknown colors", () => {
    const plan = planCapture(
      { groups: [], links: [link("https://a.example/")] },
      {
        inbox: "收件匣",
        tabs: [
          { url: "https://a.example/" },
          { url: "https://b.example/", group: "X", color: "magenta" },
          { url: "https://b.example/" },
          { url: "javascript:alert(1)" },
          { url: "https://c.example/", icon: "http://insecure/icon.png" },
        ],
      },
    );
    expect(plan).toMatchObject({ added: 2, dup: 2 });
    const docs = plan.ops.flatMap((o) => (o.type === "set" ? [o.doc] : []));
    expect(docs.find((d) => "name" in d && d.name === "X")).toMatchObject({
      color: "none",
    });
    expect(
      docs.find((d) => "url" in d && d.url === "https://c.example/"),
    ).toMatchObject({
      icon: null,
    });
  });
});

describe("incomingFromLocation", () => {
  it("reads the extension's fragment", () => {
    const payload = {
      inbox: "收件匣 11/09",
      tabs: [{ url: "https://a.example/" }],
    };
    const hash = `#tabs=${encodeURIComponent(JSON.stringify(payload))}`;
    expect(incomingFromLocation(hash, "")).toEqual(payload);
  });

  it("finds a URL in a share sheet's text", () => {
    expect(
      incomingFromLocation(
        "",
        "?title=Hi&text=look+https%3A%2F%2Fa.example%2Fx",
      ),
    ).toEqual({
      inbox: "收件匣",
      tabs: [{ url: "https://a.example/x", title: "Hi" }],
    });
  });

  it("ignores junk", () => {
    expect(incomingFromLocation("#tabs=%7Bnope", "")).toBeNull();
    expect(incomingFromLocation("", "?text=no+link")).toBeNull();
  });
});
