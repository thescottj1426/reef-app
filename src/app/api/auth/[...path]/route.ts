import { auth } from "@/lib/auth/server";
import { NextRequest } from "next/server";

const handlers = auth.handler();

type Ctx = { params: Promise<{ path: string[] }> };

async function handle(fn: (req: NextRequest, ctx: Ctx) => Promise<Response>, req: NextRequest, ctx: Ctx) {
  const res = await fn(req, ctx);
  if (!res.ok) {
    const body = await res.clone().text();
    console.error(`[auth] ${req.method} ${new URL(req.url).pathname} → ${res.status}`, body);
  }
  return res;
}

export const GET = (req: NextRequest, ctx: Ctx) => handle(handlers.GET, req, ctx);
export const POST = (req: NextRequest, ctx: Ctx) => handle(handlers.POST, req, ctx);
