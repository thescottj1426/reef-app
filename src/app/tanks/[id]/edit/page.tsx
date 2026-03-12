import { notFound } from "next/navigation";
import { getAuthUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { AppNav } from "@/components/AppNav";
import { Container, Title, Paper, Stack, Button, Group } from "@mantine/core";
import { TankForm } from "@/features/tanks/components/TankForm";

export default async function EditTankPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { session } = await getAuthUser();

  const tank = await prisma.tank.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      volumeGal: true,
      type: true,
      setupDate: true,
      description: true,
      user: { select: { neonAuthId: true } },
    },
  });

  if (!tank || tank.user.neonAuthId !== session.user.id) notFound();

  return (
    <>
      <AppNav />
      <Container size="sm" py="xl">
        <Stack gap="lg">
          <Group>
            <Button component="a" href={`/tanks/${id}`} variant="subtle" size="sm" color="gray">
              ← Back
            </Button>
          </Group>
          <Title order={2}>Edit Tank</Title>
          <Paper withBorder p="lg">
            <TankForm
              tankId={id}
              initialValues={{
                name: tank.name,
                volumeGal: tank.volumeGal,
                type: tank.type,
                setupDate: tank.setupDate ? new Date(tank.setupDate) : null,
                description: tank.description ?? "",
              }}
            />
          </Paper>
        </Stack>
      </Container>
    </>
  );
}
