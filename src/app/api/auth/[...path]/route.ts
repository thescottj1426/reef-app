import { auth } from "@/lib/auth/server";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

const handlers = auth.handler();

export async function GET(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const res = await handlers.GET(req, ctx);
  if (!res.ok) {
    const text = await res.clone().text();
    console.error(`[auth:GET] ${new URL(req.url).pathname} → ${res.status}:`, text);
  }
  return res;
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  const upstreamPath = path.join("/");
  const baseUrl = process.env.NEON_AUTH_BASE_URL!;
  const upstreamUrl = `${baseUrl}/${upstreamPath}`;

  const body = await req.text();
  const origin = req.headers.get("origin") || new URL(req.url).origin;
  const contentType = req.headers.get("content-type") || "application/json";
  const cookie = req.headers.get("cookie") || "";

  try {
    const upstream = await fetch(upstreamUrl, {
      method: "POST",
      headers: {
        "content-type": contentType,
        "origin": origin,
        "cookie": cookie,
      },
      body: body || undefined,
    });

    const text = await upstream.text();

    if (!upstream.ok) {
      console.error(`[auth:POST] ${upstreamPath} → ${upstream.status}:`, text);
    }

    const resHeaders = new Headers();
    resHeaders.set("content-type", upstream.headers.get("content-type") || "application/json");
    for (const cookie of upstream.headers.getSetCookie()) {
      resHeaders.append("set-cookie", cookie);
    }

    return new Response(text || null, {
      status: upstream.status,
      headers: resHeaders,
    });
  } catch (err) {
    console.error(`[auth:POST] ${upstreamPath} threw:`, err);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
