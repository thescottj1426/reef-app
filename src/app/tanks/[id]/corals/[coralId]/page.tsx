import { notFound, redirect } from "next/navigation";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { auth0 } from "@/lib/auth0";
import { prisma } from "@/lib/prisma";
import { s3 } from "@/lib/s3";
import { Container, Title, Text, Group, Badge, Button, Stack, Paper, SimpleGrid } from "@mantine/core";
import { CoralPhotoGallery } from "@/features/coral/components/CoralPhotoGallery";

const placementLabels: Record<string, string> = {
  SANDBED: "Sand Bed",
  LOW_ROCK: "Low Rock",
  MID_ROCK: "Mid Rock",
  HIGH_ROCK: "High Rock",
  FRAG_RACK: "Frag Rack",
};

const levelLabels: Record<string, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
};

export default async function CoralPage({
  params,
}: {
  params: Promise<{ id: string; coralId: string }>;
}) {
  const { id: tankId, coralId } = await params;

  const session = await auth0.getSession();
  if (!session) redirect("/login");

  const coral = await prisma.coral.findUnique({
    where: { id: coralId },
    include: {
      photos: { orderBy: { createdAt: "desc" } },
      tank: { select: { name: true, user: { select: { auth0Id: true } } } },
    },
  });

  if (!coral || coral.tankId !== tankId || coral.tank.user.auth0Id !== session.user.sub) {
    notFound();
  }

  const photos = await Promise.all(
    coral.photos.map(async (photo) => ({
      id: photo.id,
      url: await getSignedUrl(
        s3,
        new GetObjectCommand({ Bucket: process.env.AWS_S3_BUCKET!, Key: photo.s3Key }),
        { expiresIn: 3600 }
      ),
    }))
  );

  return (
    <Container size="md" py="xl">
      <Stack>
        <Group justify="space-between" align="center">
          <Button component="a" href={`/tanks/${tankId}`} variant="subtle" size="sm">
            ← {coral.tank.name}
          </Button>
        </Group>

        {photos.length > 0 && (
          <div style={{ borderRadius: "var(--mantine-radius-md)", overflow: "hidden", maxHeight: 400 }}>
            <img
              src={photos[0].url}
              alt={coral.name}
              style={{ width: "100%", height: 400, objectFit: "cover", display: "block" }}
            />
          </div>
        )}

        <Group align="center" gap="sm">
          <Title order={2}>{coral.name}</Title>
          {coral.species && (
            <Badge variant="light" size="lg" style={{ fontStyle: "italic" }}>
              {coral.species}
            </Badge>
          )}
        </Group>

        <Paper withBorder p="md" radius="md">
          <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
            <Stack gap={2}>
              <Text size="xs" c="dimmed" fw={500} tt="uppercase">Placement</Text>
              <Text fw={500}>{coral.placement ? placementLabels[coral.placement] : "—"}</Text>
            </Stack>
            <Stack gap={2}>
              <Text size="xs" c="dimmed" fw={500} tt="uppercase">Lighting</Text>
              <Text fw={500}>{coral.lighting ? levelLabels[coral.lighting] : "—"}</Text>
            </Stack>
            <Stack gap={2}>
              <Text size="xs" c="dimmed" fw={500} tt="uppercase">Flow</Text>
              <Text fw={500}>{coral.flow ? levelLabels[coral.flow] : "—"}</Text>
            </Stack>
            <Stack gap={2}>
              <Text size="xs" c="dimmed" fw={500} tt="uppercase">Acquired</Text>
              <Text fw={500}>
                {coral.acquiredDate ? new Date(coral.acquiredDate).toLocaleDateString() : "—"}
              </Text>
            </Stack>
          </SimpleGrid>
          {coral.notes && (
            <Stack gap={2} mt="md">
              <Text size="xs" c="dimmed" fw={500} tt="uppercase">Notes</Text>
              <Text>{coral.notes}</Text>
            </Stack>
          )}
        </Paper>

        <Title order={3} mt="md">Photos</Title>
        <CoralPhotoGallery coralId={coralId} photos={photos} />
      </Stack>
    </Container>
  );
}
