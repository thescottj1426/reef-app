import { redirect } from "next/navigation";
import { auth } from "./server";
import { prisma } from "@/lib/prisma";

function slugifyUsername(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 24);
}

async function getUniqueUsername(seed: string) {
  const base = slugifyUsername(seed) || "reef_user";
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const candidate = attempt === 0 ? base : `${base}_${attempt + 1}`;
    const exists = await prisma.user.findUnique({
      where: { username: candidate },
      select: { id: true },
    });
    if (!exists) return candidate;
  }
  return `${base}_${Date.now()}`.slice(0, 24);
}

export async function getAuthUser() {
  const result = await auth.getSession();
  if (!result.data) redirect("/auth/sign-in");

  const session = result.data;

  // Find by neonAuthId or email (handles migration from old auth provider)
  let user = await prisma.user.findFirst({
    where: {
      OR: [{ neonAuthId: session.user.id }, { email: session.user.email }],
    },
  });

  if (user) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        neonAuthId: session.user.id,
        email: session.user.email,
        displayName: user.displayName ?? session.user.name ?? undefined,
      },
    });
  } else {
    const username = await getUniqueUsername(session.user.name ?? session.user.email.split("@")[0]);
    user = await prisma.user.create({
      data: {
        neonAuthId: session.user.id,
        email: session.user.email,
        username,
        displayName: session.user.name ?? null,
      },
    });
  }

  return { session, user };
}
