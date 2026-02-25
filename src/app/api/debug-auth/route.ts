import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const baseUrl = process.env.NEON_AUTH_BASE_URL!;
  const origin = new URL(req.url).origin;

  try {
    const r = await fetch(`${baseUrl}/sign-in/email`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "origin": origin,
      },
      body: JSON.stringify({ email: "debugtest@test.com", password: "testpassword123" }),
    });

    const body = await r.text();
    const headers = Object.fromEntries(r.headers.entries());

    return Response.json({ status: r.status, body, headers });
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
