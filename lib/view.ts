/** The homepage audience view, selected by the header's HUMAN/AGENT toggle. */
export const VIEWS = ["human", "agent"] as const;
export type View = (typeof VIEWS)[number];

export const VIEW_PARAM = "view";

/** Reads a `?view=` value; anything unrecognized falls back to `human`. */
export function parseView(raw: string | string[] | null | undefined): View {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value === "agent" ? "agent" : "human";
}

/** The view a page belongs to. Only the homepage's agent view is for agents;
 * every other page (subscribe, account, docs, posts, …) is for humans. */
export function activeView(
  pathname: string,
  raw: string | string[] | null | undefined,
): View {
  return pathname === "/" ? parseView(raw) : "human";
}

/** Homepage URL for a view. `human` is the canonical, param-free homepage. */
export function viewHref(view: View): string {
  switch (view) {
    case "human":
      return "/";
    case "agent":
      return `/?${VIEW_PARAM}=agent`;
    default: {
      const unreachable: never = view;
      return unreachable;
    }
  }
}
