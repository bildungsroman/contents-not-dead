import fs from "node:fs";
import path from "node:path";
import { getPost, ASSETS_DIR, type Post } from "@/lib/content";
import { verifyAssetToken } from "@/lib/assets";
import { hasContentAccess } from "@/lib/access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MIME: Record<string, string> = {
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

/**
 * Only an asset the post itself claims may be served: its frontmatter `image`,
 * or a file its markdown body links to. This keeps one post's token from
 * enumerating the whole assets directory.
 */
function postOwnsAsset(post: Post, file: string): boolean {
  if (file === post.image) return true;
  return post.contents.includes(file);
}

/** Serves full-resolution paid image assets held outside `public/`. */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const post = getPost(id);
  if (!post) {
    return new Response("Not found", { status: 404 });
  }

  const search = new URL(request.url).searchParams;
  // `file` requests an inline asset; without it, the post's own image.
  const file = search.get("file") || (post.type === "image" ? post.image : null);
  if (!file || !postOwnsAsset(post, file)) {
    return new Response("Not found", { status: 404 });
  }

  const token = search.get("token") || "";
  const authorized = verifyAssetToken(id, token) || (await hasContentAccess());
  if (!authorized) {
    return new Response("Payment or subscription required", { status: 402 });
  }

  // Guard against path traversal — only serve files inside ASSETS_DIR.
  const normalized = path.normalize(path.join(ASSETS_DIR, file));
  if (
    !normalized.startsWith(ASSETS_DIR + path.sep) ||
    !fs.existsSync(normalized)
  ) {
    return new Response("Not found", { status: 404 });
  }

  const data = fs.readFileSync(normalized);
  const ext = path.extname(normalized).toLowerCase();
  return new Response(new Uint8Array(data), {
    headers: {
      "Content-Type": MIME[ext] || "application/octet-stream",
      "Cache-Control": "private, no-store, max-age=0",
    },
  });
}
