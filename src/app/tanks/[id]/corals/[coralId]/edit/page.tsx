import { notFound } from "next/navigation";
import { getAuthUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { AppNav } from "@/components/AppNav";
import { Container, Title, Paper, Stack, Button, Group } from "@mantine/core";
import { CoralForm } from "@/features/coral/components/CoralForm";

export default async function EditCoralPage({
  params,
}: {
  params: Promise<{ id: string; coralId: string }>;
}) {
  const { id: tankId, coralId } = await params;
  const { session } = await getAuthUser();

  const coral = await prisma.coral.findUnique({
    where: { id: coralId },
    select: {
      id: true,
      tankId: true,
      name: true,
      species: true,
      category: true,
      placement: true,
      lighting: true,
      flow: true,
      acquiredDate: true,
      notes: true,
      tank: { select: { name: true, user: { select: { neonAuthId: true } } } },
    },
  });

  if (!coral || coral.tankId !== tankId || coral.tank.user.neonAuthId !== session.user.id) {
    notFound();
  }

  return (
    <>
      <AppNav />
      <Container size="sm" py="xl">
        <Stack gap="lg">
          <Group>
            <Button
              component="a"
              href={`/tanks/${tankId}/corals/${coralId}`}
              variant="subtle"
              size="sm"
              color="gray"
            >
              ← Back
            </Button>
          </Group>
          <Title order={2}>Edit Coral</Title>
          <Paper withBorder p="lg">
            <CoralForm
              tankId={tankId}
              coralId={coralId}
              initialValues={{
                name: coral.name,
                species: coral.species ?? "",
                category: coral.category ?? "",
                placement: coral.placement ?? "",
                lighting: coral.lighting ?? "",
                flow: coral.flow ?? "",
                acquiredDate: coral.acquiredDate ? new Date(coral.acquiredDate) : null,
                notes: coral.notes ?? "",
              }}
            />
          </Paper>
        </Stack>
      </Container>
    </>
  );
}
