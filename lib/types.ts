export const GROUP_COLORS = [
  "none",
  "grey",
  "blue",
  "red",
  "yellow",
  "green",
  "pink",
  "purple",
  "cyan",
  "orange",
] as const;
export type GroupColor = (typeof GROUP_COLORS)[number];

export type Group = {
  id: string;
  name: string;
  color: GroupColor;
  position: number;
  collapsed: boolean;
};

export type Link = {
  id: string;
  group_id: string | null;
  url: string;
  title: string;
  note: string;
  tags: string[];
  description: string;
  image: string | null;
  icon: string | null;
  meta_fetched_at: string | null;
  position: number;
  created_at: string;
};

export const VIEW_MODES = [
  "list",
  "compact",
  "medium",
  "large",
  "icons",
  "gallery",
] as const;
export type ViewMode = (typeof VIEW_MODES)[number];

/** Host without "www.", or the input when it isn't a URL. */
export function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
