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
  try {
    const res = await handlers.POST(req, ctx);
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
