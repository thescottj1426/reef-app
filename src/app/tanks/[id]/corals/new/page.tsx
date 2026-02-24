import { redirect } from "next/navigation";
import { auth0 } from "@/lib/auth0";
import { prisma } from "@/lib/prisma";
import { Container, Title } from "@mantine/core";
import { CoralForm } from "@/features/coral/components/CoralForm";

export default async function NewCoralPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: tankId } = await params;

  const session = await auth0.getSession();
  if (!session) redirect("/login");

  const tank = await prisma.tank.findUnique({
    where: { id: tankId },
    select: { name: true, user: { select: { auth0Id: true } } },
  });

  if (!tank || tank.user.auth0Id !== session.user.sub) redirect("/");

  return (
    <Container size="sm" py="xl">
      <Title order={2} mb="lg">
        Add Coral to {tank.name}
      </Title>
      <CoralForm tankId={tankId} />
    </Container>
  );
}
