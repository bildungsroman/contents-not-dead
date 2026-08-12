import "server-only";

import { IS_DEMO } from "./config";

export interface GenerateInput {
  type: "article" | "image";
  tags: string[];
  description: string;
}

/** The bounded post payload returned to the browser session (ephemeral). */
export interface GeneratedPost {
  id: string;
  title: string;
  summary: string;
  authors: string[];
  date: string;
  tags: string[];
  type: "article" | "image";
  contents: string;
  /** Image posts: a data URL or remote URL for the generated image. */
  image?: string;
}

interface ContentGeneratorModule {
  generateArticle(input: GenerateInput): Promise<GeneratedPost>;
  generateImage(input: GenerateInput): Promise<GeneratedPost>;
}

/**
 * Generation is only permitted when demo mode is on AND the request is served
 * from the canonical demo host (or in local development, so demo devs can
 * test). Preview deployments and open-source clones can never enable it.
 */
export function isGenerationAllowed(host: string | null): boolean {
  if (!IS_DEMO) return false;
  if (process.env.NODE_ENV !== "production") return true;
  const demoHost = (process.env.DEMO_HOST || "").toLowerCase();
  if (!demoHost || !host) return false;
  const normalized = host.toLowerCase().split(":")[0];
  return normalized === demoHost || normalized === `www.${demoHost}`;
}

/**
 * Attempts to load the optional `@bildungsroman/content-generator` package at
 * runtime. The specifier is held in a variable so bundlers treat it as external
 * and clones (which don't install it) still build. Returns null when the
 * package is unavailable.
 */
export async function loadGenerator(): Promise<ContentGeneratorModule | null> {
  const moduleName = "@bildungsroman/content-generator";
  try {
    const mod = (await import(/* webpackIgnore: true */ moduleName)) as
      | ContentGeneratorModule
      | { default: ContentGeneratorModule };
    return "generateArticle" in mod ? mod : mod.default;
  } catch {
    return null;
  }
}
