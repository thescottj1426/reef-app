import { redirect } from "next/navigation";
import { auth } from "./server";
import { prisma } from "@/lib/prisma";

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
      data: { neonAuthId: session.user.id, email: session.user.email },
    });
  } else {
    user = await prisma.user.create({
      data: {
        neonAuthId: session.user.id,
        email: session.user.email,
        username: session.user.name ?? session.user.email.split("@")[0],
      },
    });
  }

  return { session, user };
}
