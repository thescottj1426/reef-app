import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { AppNav } from "@/components/AppNav";
import { Container, Title, Paper, Button, Group } from "@mantine/core";
import { CoralForm } from "@/features/coral/components/CoralForm";

export default async function NewCoralPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: tankId } = await params;

  const { session } = await getAuthUser();

  const tank = await prisma.tank.findUnique({
    where: { id: tankId },
    select: { name: true, user: { select: { neonAuthId: true } } },
  });

  if (!tank || tank.user.neonAuthId !== session.user.id) redirect("/");

  return (
    <>
      <AppNav />
      <Container size="sm" py="xl">
        <Group mb="lg">
          <Button component="a" href={`/tanks/${tankId}`} variant="subtle" size="sm" color="gray">
            ← {tank.name}
          </Button>
        </Group>
        <Title order={2} mb="lg">Add Coral to {tank.name}</Title>
        <Paper withBorder p="xl">
          <CoralForm tankId={tankId} />
        </Paper>
      </Container>
    </>
  );
}
