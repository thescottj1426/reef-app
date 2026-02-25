import { notFound } from "next/navigation";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getAuthUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { s3 } from "@/lib/s3";
import { Container, Title, Text, Group, Badge, Button, Stack, SimpleGrid, Card, CardSection } from "@mantine/core";
import { AppNav } from "@/components/AppNav";
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

  const { session } = await getAuthUser();

  const coral = await prisma.coral.findUnique({
    where: { id: coralId },
    include: {
      photos: { orderBy: { createdAt: "desc" } },
      tank: { select: { name: true, user: { select: { neonAuthId: true } } } },
    },
  });

  if (!coral || coral.tankId !== tankId || coral.tank.user.neonAuthId !== session.user.id) {
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
    <>
      <AppNav />
      <Container size="md" py="xl">
        <Stack>
        <Group mb="md">
          <Button component="a" href={`/tanks/${tankId}`} variant="subtle" size="sm" color="gray">
            ← {coral.tank.name}
          </Button>
        </Group>

        <Card withBorder>
          {photos.length > 0 && (
            <CardSection>
              <img
                src={photos[0].url}
                alt={coral.name}
                style={{ width: "100%", height: 400, objectFit: "cover", display: "block" }}
              />
            </CardSection>
          )}
          <Stack gap="lg" mt="md">
            <Group align="center" gap="sm">
              <Title order={2}>{coral.name}</Title>
              {coral.species && (
                <Badge variant="light" color="teal" size="lg" style={{ fontStyle: "italic" }}>
                  {coral.species}
                </Badge>
              )}
            </Group>
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
              <Stack gap={2}>
                <Text size="xs" c="dimmed" fw={500} tt="uppercase">Notes</Text>
                <Text>{coral.notes}</Text>
              </Stack>
            )}
          </Stack>
        </Card>

        <Title order={3} mt="md">Photos</Title>
        <CoralPhotoGallery coralId={coralId} photos={photos} />
        </Stack>
      </Container>
    </>
  );
}
