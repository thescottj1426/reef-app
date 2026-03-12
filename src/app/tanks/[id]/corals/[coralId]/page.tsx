import { notFound } from "next/navigation";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getAuthUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { s3 } from "@/lib/s3";
import { Container, Title, Text, Group, Badge, Button, Stack, SimpleGrid, Card, CardSection, Paper } from "@mantine/core";
import { AppNav } from "@/components/AppNav";
import { CoralPhotoGallery } from "@/features/coral/components/CoralPhotoGallery";
import { DeleteCoralButton } from "@/components/DeleteCoralButton";
import { CoralTimeline } from "@/features/coral/components/CoralTimeline";
import { LikeButton } from "@/features/social/components/LikeButton";
import { CommentSection } from "@/features/social/components/CommentSection";
import { CreateFragListingButton } from "@/features/frags/components/CreateFragListingButton";

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

  const { session, user } = await getAuthUser();

  const coral = await prisma.coral.findUnique({
    where: { id: coralId },
    include: {
      photos: { orderBy: { createdAt: "desc" } },
      ownershipEvents: { orderBy: { date: "desc" } },
      tank: { select: { name: true, user: { select: { neonAuthId: true } } } },
      fragListings: { where: { status: "AVAILABLE" }, take: 1 },
    },
  });

  if (!coral || coral.tankId !== tankId) notFound();
  const isOwner = coral.tank.user.neonAuthId === session.user.id;

  const [photos, likeCount, userLike, comments] = await Promise.all([
    Promise.all(
      coral.photos.map(async (photo) => ({
        id: photo.id,
        url: await getSignedUrl(
          s3,
          new GetObjectCommand({ Bucket: process.env.AWS_S3_BUCKET!, Key: photo.s3Key }),
          { expiresIn: 3600 }
        ),
      }))
    ),
    prisma.like.count({ where: { targetType: "CORAL", targetId: coralId } }),
    prisma.like.findUnique({
      where: { userId_targetType_targetId: { userId: user.id, targetType: "CORAL", targetId: coralId } },
    }),
    prisma.comment.findMany({
      where: { targetType: "CORAL", targetId: coralId },
      include: {
        user: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const hasActiveListing = coral.fragListings.length > 0;

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
              <Group justify="space-between" align="flex-start">
                <Group align="center" gap="sm">
                  <Title order={2}>{coral.name}</Title>
                  {coral.category && (
                    <Badge variant="light" color={categoryColors[coral.category]} size="lg">
                      {coral.category}
                    </Badge>
                  )}
                  {coral.species && (
                    <Badge variant="light" color="teal" size="lg" style={{ fontStyle: "italic" }}>
                      {coral.species}
                    </Badge>
                  )}
                </Group>
                {isOwner && (
                  <Group gap="xs">
                    <Button
                      component="a"
                      href={`/tanks/${tankId}/corals/${coralId}/edit`}
                      variant="subtle"
                      size="sm"
                    >
                      Edit
                    </Button>
                    <DeleteCoralButton coralId={coralId} coralName={coral.name} />
                  </Group>
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
              <Group gap="xs">
                <LikeButton
                  targetType="CORAL"
                  targetId={coralId}
                  initialCount={likeCount}
                  initialLiked={!!userLike}
                  revalidate={`/tanks/${tankId}/corals/${coralId}`}
                />
                {isOwner && !hasActiveListing && (
                  <CreateFragListingButton coralId={coralId} coralName={coral.name} />
                )}
                {isOwner && hasActiveListing && (
                  <Button component="a" href="/frags" variant="subtle" size="sm" color="teal">
                    Listed on Frag Board
                  </Button>
                )}
              </Group>
            </Stack>
          </Card>

          {isOwner && (
            <>
              <Title order={3} mt="md">Photos</Title>
              <CoralPhotoGallery coralId={coralId} photos={photos} />
            </>
          )}

          <CoralTimeline
            coralId={coralId}
            events={coral.ownershipEvents}
            isOwner={isOwner}
          />

          <Paper withBorder p="lg">
            <Title order={4} mb="md">Comments</Title>
            <CommentSection
              targetType="CORAL"
              targetId={coralId}
              initialComments={comments}
              currentUserId={user.id}
              revalidate={`/tanks/${tankId}/corals/${coralId}`}
            />
          </Paper>
        </Stack>
      </Container>
    </>
  );
}
