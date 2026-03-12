import { notFound } from "next/navigation";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getAuthUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { s3 } from "@/lib/s3";
import { AppNav } from "@/components/AppNav";
import {
  Container,
  Title,
  Text,
  Group,
  Badge,
  Button,
  Stack,
  SimpleGrid,
  Card,
  CardSection,
  Paper,
} from "@mantine/core";
import { PhotoGallery } from "@/features/tanks/components/PhotoGallery";
import { DeleteTankButton } from "@/components/DeleteTankButton";
import { LikeButton } from "@/features/social/components/LikeButton";
import { CommentSection } from "@/features/social/components/CommentSection";
import { WaterParameterLog } from "@/features/tanks/components/WaterParameterLog";
import { EquipmentList } from "@/features/tanks/components/EquipmentList";

const placementLabels: Record<string, string> = {
  SANDBED: "Sand Bed",
  LOW_ROCK: "Low Rock",
  MID_ROCK: "Mid Rock",
  HIGH_ROCK: "High Rock",
  FRAG_RACK: "Frag Rack",
};

const categoryColors: Record<string, string> = {
  SPS: "red", LPS: "teal", SOFTIE: "violet",
  ZOA: "yellow", ANEMONE: "pink", OTHER: "gray",
};

export default async function TankPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const { session, user } = await getAuthUser();

  const tank = await prisma.tank.findUnique({
    where: { id },
    include: {
      photos: { orderBy: { createdAt: "desc" } },
      corals: {
        orderBy: { createdAt: "desc" },
        include: {
          photos: { take: 1, orderBy: { createdAt: "desc" } },
        },
      },
      user: { select: { neonAuthId: true } },
      parameters: { orderBy: { loggedAt: "desc" }, take: 10 },
      equipment: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!tank) notFound();
  const isOwner = tank.user.neonAuthId === session.user.id;

  const [photos, likeCount, userLike, comments] = await Promise.all([
    Promise.all(
      tank.photos.map(async (photo) => ({
        id: photo.id,
        url: await getSignedUrl(
          s3,
          new GetObjectCommand({ Bucket: process.env.AWS_S3_BUCKET!, Key: photo.s3Key }),
          { expiresIn: 3600 }
        ),
      }))
    ),
    prisma.like.count({ where: { targetType: "TANK", targetId: id } }),
    prisma.like.findUnique({
      where: { userId_targetType_targetId: { userId: user.id, targetType: "TANK", targetId: id } },
    }),
    prisma.comment.findMany({
      where: { targetType: "TANK", targetId: id },
      include: {
        user: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const coralsWithPhotos = await Promise.all(
    tank.corals.map(async (coral) => ({
      ...coral,
      coverUrl: coral.photos[0]
        ? await getSignedUrl(
            s3,
            new GetObjectCommand({ Bucket: process.env.AWS_S3_BUCKET!, Key: coral.photos[0].s3Key }),
            { expiresIn: 3600 }
          )
        : null,
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
              <Group justify="space-between" align="flex-start">
                <Group align="center" gap="sm">
                  <Title order={2}>{tank.name}</Title>
                  <Badge variant="light" color="teal" size="lg">{tank.type}</Badge>
                </Group>
                {isOwner && (
                  <Group gap="xs">
                    <Button component="a" href={`/tanks/${id}/edit`} variant="subtle" size="sm">
                      Edit
                    </Button>
                    <DeleteTankButton tankId={id} tankName={tank.name} />
                  </Group>
                )}
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
              <Group>
                <LikeButton
                  targetType="TANK"
                  targetId={id}
                  initialCount={likeCount}
                  initialLiked={!!userLike}
                  revalidate={`/tanks/${id}`}
                />
              </Group>
            </Stack>
          </Card>

          {/* Water Parameters */}
          <WaterParameterLog
            tankId={id}
            parameters={tank.parameters}
            isOwner={isOwner}
          />

          {/* Equipment */}
          <EquipmentList
            tankId={id}
            equipment={tank.equipment}
            isOwner={isOwner}
          />

          <Paper withBorder p="lg">
            <Group justify="space-between" align="center" mb="md">
              <Title order={3}>Corals</Title>
              {isOwner && (
                <Button component="a" href={`/tanks/${id}/corals/new`} size="sm">
                  Add Coral
                </Button>
              )}
            </Group>

            {coralsWithPhotos.length === 0 ? (
              <Stack align="center" gap="sm" py="xl">
                <Text size="2rem">🪸</Text>
                <Text fw={600}>No corals yet</Text>
                <Text c="dimmed" size="sm">
                  {isOwner ? "Add your first coral to start building your collection." : "This tank has no corals yet."}
                </Text>
                {isOwner && (
                  <Button component="a" href={`/tanks/${id}/corals/new`} size="sm" mt="xs">
                    Add coral
                  </Button>
                )}
              </Stack>
            ) : (
              <SimpleGrid cols={{ base: 2, sm: 3 }} spacing="sm">
                {coralsWithPhotos.map((coral) => (
                  <Card
                    key={coral.id}
                    component="a"
                    href={`/tanks/${id}/corals/${coral.id}`}
                    className="coral-card"
                    p={0}
                    withBorder
                  >
                    <CardSection>
                      {coral.coverUrl ? (
                        <img
                          src={coral.coverUrl}
                          alt={coral.name}
                          style={{ width: "100%", height: 140, objectFit: "cover", display: "block" }}
                        />
                      ) : (
                        <div className="card-photo-placeholder coral-placeholder" />
                      )}
                    </CardSection>
                    <Stack gap={4} p="sm">
                      <Text fw={600} size="sm" lineClamp={1}>{coral.name}</Text>
                      {coral.species && (
                        <Text size="xs" c="dimmed" fs="italic" lineClamp={1}>{coral.species}</Text>
                      )}
                      <Group gap={4} mt={2}>
                        {coral.category && (
                          <Badge size="xs" variant="light" color={categoryColors[coral.category]}>{coral.category}</Badge>
                        )}
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
          </Paper>

          {isOwner && (
            <Paper withBorder p="lg">
              <Title order={3} mb="sm">Photos</Title>
              <PhotoGallery tankId={id} photos={photos} />
            </Paper>
          )}

          {/* Comments */}
          <Paper withBorder p="lg">
            <Title order={4} mb="md">Comments</Title>
            <CommentSection
              targetType="TANK"
              targetId={id}
              initialComments={comments}
              currentUserId={user.id}
              revalidate={`/tanks/${id}`}
            />
          </Paper>
        </Stack>
      </Container>
    </>
  );
}
