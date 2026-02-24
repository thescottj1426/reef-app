import { Auth0Client } from "@auth0/nextjs-auth0/server";
import { prisma } from "@/lib/prisma";

export const auth0 = new Auth0Client({
  async beforeSessionSaved(session) {
    await prisma.user.upsert({
      where: { auth0Id: session.user.sub },
      update: { email: session.user.email! },
      create: {
        auth0Id: session.user.sub,
        email: session.user.email!,
        username: session.user.nickname ?? session.user.email!.split("@")[0],
      },
    });
    return session;
  },
});
