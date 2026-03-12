import { auth } from "@/lib/auth/server";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

const handlers = auth.handler();

// Normalize Origin header so Neon Auth server always sees the trusted origin
// regardless of which Vercel preview/branch URL the browser is on.
const TRUSTED_ORIGIN = process.env.BETTER_AUTH_URL;

function normalizeOrigin(req: NextRequest): NextRequest {
  if (!TRUSTED_ORIGIN) return req;
  const origin = req.headers.get("origin");
  if (!origin || origin === TRUSTED_ORIGIN) return req;
  const headers = new Headers(req.headers);
  headers.set("origin", TRUSTED_ORIGIN);
  return new NextRequest(req.url, { method: req.method, headers, body: req.body } as NextRequest);
}

// Neon Auth beta bug: sending existing session cookies with sign-in/sign-up
// causes the backend to crash. Strip them for those endpoints.
const NEON_AUTH_COOKIE_PREFIX = "__Secure-neon-auth.";

function stripNeonAuthCookies(req: NextRequest): NextRequest {
  const cookieHeader = req.headers.get("cookie");
  if (!cookieHeader) return req;

  const filtered = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .filter((c) => !c.startsWith(NEON_AUTH_COOKIE_PREFIX))
    .join("; ");

  const headers = new Headers(req.headers);
  if (filtered) {
    headers.set("cookie", filtered);
  } else {
    headers.delete("cookie");
  }

  return new NextRequest(req.url, { method: req.method, headers, body: req.body } as NextRequest);
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const res = await handlers.GET(normalizeOrigin(req), ctx);
  if (!res.ok) {
    const text = await res.clone().text();
    console.error(`[auth:GET] ${new URL(req.url).pathname} → ${res.status}:`, text);
  }
  return res;
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  const isCredentialEndpoint = path[0] === "sign-in" || path[0] === "sign-up";
  const proxiedReq = isCredentialEndpoint ? stripNeonAuthCookies(normalizeOrigin(req)) : normalizeOrigin(req);

  try {
    const res = await handlers.POST(proxiedReq, ctx);
    if (!res.ok) {
      const text = await res.clone().text();
      console.error(`[auth:POST] ${new URL(req.url).pathname} → ${res.status}:`, text);
    }
    return res;
  } catch (err) {
    console.error(`[auth:POST] ${new URL(req.url).pathname} threw:`, err);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
