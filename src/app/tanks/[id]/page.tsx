import { notFound } from "next/navigation";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getAuthUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { s3 } from "@/lib/s3";
import { AppNav } from "@/components/AppNav";
import { Container, Title, Text, Group, Badge, Button, Stack, SimpleGrid, Card, CardSection } from "@mantine/core";
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

  const { session } = await getAuthUser();

  const tank = await prisma.tank.findUnique({
    where: { id },
    include: {
      photos: { orderBy: { createdAt: "desc" } },
      corals: { orderBy: { createdAt: "desc" } },
      user: { select: { neonAuthId: true } },
    },
  });

  if (!tank || tank.user.neonAuthId !== session.user.id) notFound();

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
    <>
      <AppNav />
      <Container size="md" py="xl">
        <Stack gap="xl">
          <Group>
            <Button component="a" href="/" variant="subtle" size="sm" color="gray">
              ← My Tanks
            </Button>
          </Group>

          <Card withBorder>
            {photos.length > 0 && (
              <CardSection>
                <img
                  src={photos[0].url}
                  alt={tank.name}
                  style={{ width: "100%", height: 360, objectFit: "cover", display: "block" }}
                />
              </CardSection>
            )}
            <Stack gap="lg" mt="md">
              <Group align="center" gap="sm">
                <Title order={2}>{tank.name}</Title>
                <Badge variant="light" color="teal" size="lg">{tank.type}</Badge>
              </Group>
              <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="lg">
                <Stack gap={4}>
                  <Text size="xs" c="dimmed" fw={600} tt="uppercase" style={{ letterSpacing: "0.05em" }}>Volume</Text>
                  <Text fw={600} size="lg">{tank.volumeGal} gal</Text>
                </Stack>
                <Stack gap={4}>
                  <Text size="xs" c="dimmed" fw={600} tt="uppercase" style={{ letterSpacing: "0.05em" }}>Type</Text>
                  <Text fw={600} size="lg">{tank.type}</Text>
                </Stack>
                <Stack gap={4}>
                  <Text size="xs" c="dimmed" fw={600} tt="uppercase" style={{ letterSpacing: "0.05em" }}>Setup Date</Text>
                  <Text fw={600} size="lg">
                    {tank.setupDate ? new Date(tank.setupDate).toLocaleDateString() : "—"}
                  </Text>
                </Stack>
                <Stack gap={4}>
                  <Text size="xs" c="dimmed" fw={600} tt="uppercase" style={{ letterSpacing: "0.05em" }}>Corals</Text>
                  <Text fw={600} size="lg">{tank.corals.length}</Text>
                </Stack>
              </SimpleGrid>
              {tank.description && (
                <Stack gap={4}>
                  <Text size="xs" c="dimmed" fw={600} tt="uppercase" style={{ letterSpacing: "0.05em" }}>Description</Text>
                  <Text>{tank.description}</Text>
                </Stack>
              )}
            </Stack>
          </Card>

          <div>
            <Group justify="space-between" align="center" mb="sm">
              <Title order={3}>Corals</Title>
              <Button component="a" href={`/tanks/${id}/corals/new`} size="sm">
                Add Coral
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
                    className="coral-card"
                    p="sm"
                  >
                    <Stack gap={4}>
                      <Text fw={600} size="sm" lineClamp={1}>{coral.name}</Text>
                      {coral.species && (
                        <Text size="xs" c="dimmed" fs="italic" lineClamp={1}>{coral.species}</Text>
                      )}
                      <Group gap={4} mt={2}>
                        {coral.placement && (
                          <Badge size="xs" variant="light" color="teal">{placementLabels[coral.placement]}</Badge>
                        )}
                        {coral.lighting && (
                          <Badge size="xs" variant="dot" color="yellow">{coral.lighting}</Badge>
                        )}
                        {coral.flow && (
                          <Badge size="xs" variant="dot" color="cyan">{coral.flow}</Badge>
                        )}
                      </Group>
                    </Stack>
                  </Card>
                ))}
              </SimpleGrid>
            )}
          </div>

          <div>
            <Title order={3} mb="sm">Photos</Title>
            <PhotoGallery tankId={id} photos={photos} />
          </div>
        </Stack>
      </Container>
    </>
  );
}
