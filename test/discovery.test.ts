import { beforeEach, describe, expect, it } from "vitest";
import { GET as agents } from "@/app/agents/route";
import { GET as llms } from "@/app/llms.txt/route";
import { GET as openapi } from "@/app/openapi.json/route";
import { GET as mppJson } from "@/app/well-known/mpp.json/route";
import { GET as mppMd } from "@/app/well-known/mpp.md/route";

const API = "https://api.example.com";
const SITE = "https://www.example.com";

/**
 * Every document an agent can land on must agree about which origin to call.
 *
 * This matters beyond tidiness: the MPP challenge realm is pinned to the API
 * origin, so a document that sends an agent to the site origin for paid
 * content earns a challenge whose realm doesn't match the host it dialled —
 * the realm mismatch that breaks discovery.
 */
/**
 * Documents that link to endpoints with absolute URLs. `/openapi.json` is
 * checked separately because its paths are relative to `servers[0].url`, which
 * is how the contract is meant to express them.
 */
const documents: Record<string, () => Promise<Response>> = {
  "/.well-known/mpp.json": mppJson,
  "/.well-known/mpp.md": mppMd,
  "/agents": agents,
  "/llms.txt": llms,
};

function urlsIn(text: string): string[] {
  return text.match(/https?:\/\/[^\s)"'`,\]]+/g) ?? [];
}

describe("discovery documents", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_URL = API;
    process.env.NEXT_PUBLIC_APP_URL = SITE;
  });

  for (const [name, handler] of Object.entries(documents)) {
    describe(name, () => {
      it("points agents at the API origin for paid content", async () => {
        const urls = urlsIn(await (await handler()).text()).filter((u) =>
          u.includes("/api/content"),
        );
        expect(urls.length).toBeGreaterThan(0);
        for (const url of urls) expect(url.startsWith(API), url).toBe(true);
      });

      it("points humans at the site origin to subscribe", async () => {
        const urls = urlsIn(await (await handler()).text()).filter((u) =>
          u.endsWith("/subscribe"),
        );
        for (const url of urls) expect(url.startsWith(SITE), url).toBe(true);
      });
    });
  }

  describe("/openapi.json", () => {
    it("serves paid content from the API origin", async () => {
      const doc = await (await openapi()).json();
      expect(doc.servers[0].url).toBe(API);
      // Relative to servers[0], so the base must not be repeated here.
      expect(Object.keys(doc.paths)).toContain("/api/content/{id}");
      for (const path of Object.keys(doc.paths)) {
        expect(path.startsWith("/"), path).toBe(true);
      }
    });

    it("points humans at the site origin to subscribe", async () => {
      const doc = await (await openapi()).json();
      for (const url of urlsIn(JSON.stringify(doc)).filter((u) =>
        u.endsWith("/subscribe"),
      )) {
        expect(url.startsWith(SITE), url).toBe(true);
      }
    });
  });

  it("cross-links the OpenAPI contract from every machine-readable document", async () => {
    for (const [name, handler] of Object.entries(documents)) {
      const text = await (await handler()).text();
      expect(text, name).toContain(`${API}/openapi.json`);
    }
  });
});
