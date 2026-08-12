import fs from "node:fs";
import path from "node:path";
import { getPost, ASSETS_DIR } from "@/lib/content";
import { verifyAssetToken } from "@/lib/assets";
import { currentUserHasActiveSubscription } from "@/lib/subscription";

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

/** Serves full-resolution paid image assets held outside `public/`. */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const post = getPost(id);
  if (!post || post.type !== "image" || !post.image) {
    return new Response("Not found", { status: 404 });
  }

  const token = new URL(request.url).searchParams.get("token") || "";
  const authorized =
    verifyAssetToken(id, token) || (await currentUserHasActiveSubscription());
  if (!authorized) {
    return new Response("Payment or subscription required", { status: 402 });
  }

  // Guard against path traversal — only serve files inside ASSETS_DIR.
  const filePath = path.join(ASSETS_DIR, post.image);
  const normalized = path.normalize(filePath);
  if (!normalized.startsWith(ASSETS_DIR) || !fs.existsSync(normalized)) {
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
