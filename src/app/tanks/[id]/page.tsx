import { notFound, redirect } from "next/navigation";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { auth0 } from "@/lib/auth0";
import { prisma } from "@/lib/prisma";
import { s3 } from "@/lib/s3";
import { Container, Title, Text, Group, Badge, Button, Stack, Paper, SimpleGrid, Card } from "@mantine/core";
import { PhotoGallery } from "@/features/tanks/components/PhotoGallery";

const placementLabels: Record<string, string> = {
  SANDBED: "Sand Bed",
  LOW_ROCK: "Low Rock",
  MID_ROCK: "Mid Rock",
  HIGH_ROCK: "High Rock",
  FRAG_RACK: "Frag Rack",
};

export default async function TankPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const session = await auth0.getSession();
  if (!session) redirect("/login");

  const tank = await prisma.tank.findUnique({
    where: { id },
    include: {
      photos: { orderBy: { createdAt: "desc" } },
      corals: { orderBy: { createdAt: "desc" } },
      user: { select: { auth0Id: true } },
    },
  });

  if (!tank || tank.user.auth0Id !== session.user.sub) notFound();

  const photos = await Promise.all(
    tank.photos.map(async (photo) => ({
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
          <Button component="a" href="/" variant="subtle" size="sm">
            ← My Tanks
          </Button>
        </Group>

        {photos.length > 0 && (
          <div style={{ borderRadius: "var(--mantine-radius-md)", overflow: "hidden", maxHeight: 400 }}>
            <img
              src={photos[0].url}
              alt={tank.name}
              style={{ width: "100%", height: 400, objectFit: "cover", display: "block" }}
            />
          </div>
        )}

        <Group align="center" gap="sm">
          <Title order={2}>{tank.name}</Title>
          <Badge variant="light" size="lg">{tank.type}</Badge>
        </Group>

        <Paper withBorder p="md" radius="md">
          <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
            <Stack gap={2}>
              <Text size="xs" c="dimmed" fw={500} tt="uppercase">Volume</Text>
              <Text fw={500}>{tank.volumeGal} gal</Text>
            </Stack>
            <Stack gap={2}>
              <Text size="xs" c="dimmed" fw={500} tt="uppercase">Type</Text>
              <Text fw={500}>{tank.type}</Text>
            </Stack>
            <Stack gap={2}>
              <Text size="xs" c="dimmed" fw={500} tt="uppercase">Setup Date</Text>
              <Text fw={500}>
                {tank.setupDate ? new Date(tank.setupDate).toLocaleDateString() : "—"}
              </Text>
            </Stack>
            <Stack gap={2}>
              <Text size="xs" c="dimmed" fw={500} tt="uppercase">Corals</Text>
              <Text fw={500}>{tank.corals.length}</Text>
            </Stack>
          </SimpleGrid>
          {tank.description && (
            <Stack gap={2} mt="md">
              <Text size="xs" c="dimmed" fw={500} tt="uppercase">Description</Text>
              <Text>{tank.description}</Text>
            </Stack>
          )}
        </Paper>

        <Group justify="space-between" align="center" mt="md">
          <Title order={3}>Corals</Title>
          <Button component="a" href={`/tanks/${id}/corals/new`} size="sm">
            + Add Coral
          </Button>
        </Group>

        {tank.corals.length === 0 ? (
          <Text c="dimmed" size="sm">No corals yet. Add your first coral!</Text>
        ) : (
          <SimpleGrid cols={{ base: 2, sm: 3 }} spacing="sm">
            {tank.corals.map((coral) => (
              <Card
                key={coral.id}
                component="a"
                href={`/tanks/${id}/corals/${coral.id}`}
                withBorder
                padding="sm"
                radius="md"
                style={{ textDecoration: "none" }}
              >
                <Stack gap={4}>
                  <Text fw={600} size="sm" lineClamp={1}>{coral.name}</Text>
                  {coral.species && (
                    <Text size="xs" c="dimmed" fs="italic" lineClamp={1}>{coral.species}</Text>
                  )}
                  <Group gap={4} mt={2}>
                    {coral.placement && (
                      <Badge size="xs" variant="light">{placementLabels[coral.placement]}</Badge>
                    )}
                    {coral.lighting && (
                      <Badge size="xs" variant="dot" color="yellow">{coral.lighting}</Badge>
                    )}
                    {coral.flow && (
                      <Badge size="xs" variant="dot" color="blue">{coral.flow}</Badge>
                    )}
                  </Group>
                </Stack>
              </Card>
            ))}
          </SimpleGrid>
        )}

        <Title order={3} mt="md">Photos</Title>
        <PhotoGallery tankId={id} photos={photos} />
      </Stack>
    </Container>
  );
}
