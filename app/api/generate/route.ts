import { NextResponse } from "next/server";
import { z } from "zod";
import { isGenerationAllowed, loadGenerator } from "@/lib/generator";
import {
  GEN_SESSION_COOKIE,
  GEN_LIMIT,
  readSession,
  createSession,
} from "@/lib/gen-session";
import { incrementWithTtl } from "@/lib/redis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const WINDOW = 60 * 60 * 24; // 24h
const IP_CEILING = 40; // per-IP daily hard cap across sessions

const bodySchema = z.object({
  type: z.enum(["article", "image"]),
  tags: z.array(z.string().min(1).max(40)).max(8).default([]),
  description: z.string().min(1).max(280),
});

export async function POST(req: Request) {
  const host = req.headers.get("host");
  if (!isGenerationAllowed(host)) {
    return NextResponse.json(
      { error: "Content generation is not available here." },
      { status: 403 },
    );
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please provide a type, description, and optional tags." },
      { status: 400 },
    );
  }

  // Resolve (or mint) a signed browser session for per-session limiting.
  const cookieHeader = req.headers.get("cookie") || "";
  const existing = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${GEN_SESSION_COOKIE}=`))
    ?.split("=")[1];
  let sessionId = readSession(existing);
  let setCookie: string | null = null;
  if (!sessionId) {
    const created = createSession();
    sessionId = created.id;
    setCookie = `${GEN_SESSION_COOKIE}=${created.cookie}; Path=/; Max-Age=${WINDOW}; HttpOnly; SameSite=Lax`;
  }

  // Per-session limit (primary) + per-IP ceiling (abuse guard).
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const sessionCount = await incrementWithTtl(`gen:s:${sessionId}`, WINDOW);
  const ipCount = await incrementWithTtl(`gen:ip:${ip}`, WINDOW);

  if (sessionCount > GEN_LIMIT || ipCount > IP_CEILING) {
    const res = NextResponse.json(
      {
        error: `You've reached the limit of ${GEN_LIMIT} generations for this session.`,
        remaining: 0,
      },
      { status: 429 },
    );
    if (setCookie) res.headers.set("Set-Cookie", setCookie);
    return res;
  }

  const remaining = Math.max(0, GEN_LIMIT - sessionCount);

  const generator = await loadGenerator();
  if (!generator) {
    return NextResponse.json(
      { error: "Generation is unavailable on this deployment." },
      { status: 503 },
    );
  }

  try {
    const input = parsed.data;
    const post =
      input.type === "image"
        ? await generator.generateImage(input)
        : await generator.generateArticle(input);
    const res = NextResponse.json({ post, remaining });
    if (setCookie) res.headers.set("Set-Cookie", setCookie);
    return res;
  } catch (err) {
    console.error("Generation failed:", (err as Error).message);
    return NextResponse.json(
      { error: "Generation failed. Please try again.", remaining },
      { status: 502 },
    );
  }
}
