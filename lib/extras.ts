import type { ComponentType } from "react";
import type { CardData } from "@/components/PostCard";

/**
 * Optional add-ons a deployment can supply without forking core components.
 * This build ships none; assign to `extras` below to enable them.
 */
export interface Extras {
  /**
   * Extra cards prepended to the post grid, for content the server doesn't
   * store. Must obey the rules of hooks: it is called on every render.
   */
  useExtraCards?: () => CardData[];
  /** Rendered below the post grid, for controls that produce extra cards. */
  GridActions?: ComponentType;
  /** Renders a post id the content store doesn't know about. */
  UnknownPost?: ComponentType<{ id: string }>;
}

export const extras: Extras = {};

const NO_CARDS: CardData[] = [];

/**
 * Stable fallback so `PostGrid` can call the hook unconditionally. `extras` is
 * fixed at module load, so the hook identity never changes between renders.
 */
export const useExtraCards: () => CardData[] =
  extras.useExtraCards ?? (() => NO_CARDS);
