import { getAuthUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { s3 } from "@/lib/s3";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { AppNav } from "@/components/AppNav";
import {
  Avatar,
  Container,
  Title,
  Text,
  Button,
  Stack,
  Group,
  Card,
  CardSection,
  SimpleGrid,
  Badge,
  Paper,
  Anchor,
} from "@mantine/core";
import { CoralEventType } from "@/generated/prisma";

const EVENT_LABELS: Record<CoralEventType, string> = {
  ACQUIRED: "acquired",
  FRAGGED: "fragged",
  SOLD: "sold",
  TRADED: "traded",
  GIFTED: "gifted",
  OBSERVATION: "noted",
};

function relativeDate(date: Date | string): string {
  const diff = Date.now() - new Date(date).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}yr ago`;
}

export default async function HomePage() {
  const { user } = await getAuthUser();

  // Get users this person follows
  const following = await prisma.follow.findMany({
    where: { followerId: user.id },
    select: { followingId: true },
  });
  const followingIds = following.map((f) => f.followingId);

  const [dbUser, communityFeed] = await Promise.all([
    prisma.user.findUnique({
      where: { id: user.id },
      select: {
        createdAt: true,
        displayName: true,
        username: true,
        tanks: {
          select: {
            id: true,
            name: true,
            type: true,
            volumeGal: true,
            photos: { select: { s3Key: true }, take: 1, orderBy: { createdAt: "desc" } },
            _count: { select: { corals: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    }),
    prisma.coralOwnershipEvent.findMany({
      where: {
        coral: {
          tank: {
            user: followingIds.length > 0
              ? { id: { in: followingIds } }
              : { id: { not: user.id } },
          },
        },
      },
      select: {
        id: true,
        eventType: true,
        date: true,
        coral: {
          select: {
            id: true,
            name: true,
            tank: {
              select: {
                id: true,
                user: {
                  select: {
                    username: true,
                    displayName: true,
                    avatarUrl: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { date: "desc" },
      take: 8,
    }),
  ]);

  const tanks = dbUser?.tanks ?? [];
  const totalCorals = tanks.reduce((sum, t) => sum + t._count.corals, 0);

  const tanksWithPhotos = await Promise.all(
    tanks.map(async (tank) => ({
      ...tank,
      coverUrl: tank.photos[0]
        ? await getSignedUrl(
            s3,
            new GetObjectCommand({ Bucket: process.env.AWS_S3_BUCKET!, Key: tank.photos[0].s3Key }),
            { expiresIn: 3600 }
          )
        : null,
    }))
  );

  const memberSince = dbUser?.createdAt
    ? new Date(dbUser.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })
    : "—";

  const greeting = dbUser?.displayName || dbUser?.username || "there";

  return (
    <>
      <AppNav />
      <Container size="md" py="xl">
        <Stack gap="xl">
          {/* Header */}
          <Paper p="lg" withBorder>
            <Group justify="space-between" align="center">
              <div>
                <Title order={2}>Welcome back, {greeting}</Title>
                <Text c="dimmed" size="sm" mt={4}>
                  Manage your tanks and track coral growth in one place.
                </Text>
              </div>
              <Button component="a" href="/tanks/new" size="sm">
                Add tank
              </Button>
            </Group>
          </Paper>

          {/* Stats bar */}
          <SimpleGrid cols={3} spacing="md">
            <Paper withBorder p="md" ta="center">
              <Text size="xl" fw={700}>{tanks.length}</Text>
              <Text size="xs" c="dimmed" tt="uppercase" style={{ letterSpacing: "0.05em" }}>Tanks</Text>
            </Paper>
            <Paper withBorder p="md" ta="center">
              <Text size="xl" fw={700}>{totalCorals}</Text>
              <Text size="xs" c="dimmed" tt="uppercase" style={{ letterSpacing: "0.05em" }}>Corals</Text>
            </Paper>
            <Paper withBorder p="md" ta="center">
              <Text size="sm" fw={700}>{memberSince}</Text>
              <Text size="xs" c="dimmed" tt="uppercase" style={{ letterSpacing: "0.05em" }}>Member Since</Text>
            </Paper>
          </SimpleGrid>

          {/* My Tanks */}
          <div>
            <Group justify="space-between" align="center" mb="md">
              <Title order={3}>My Tanks</Title>
              <Badge variant="light" size="lg">{tanks.length}</Badge>
            </Group>

            {tanksWithPhotos.length === 0 ? (
              <Paper withBorder p="xl">
                <Stack align="center" gap="sm">
                  <Text size="3rem">🐠</Text>
                  <Text fw={600} size="lg">No tanks yet</Text>
                  <Text c="dimmed" size="sm" ta="center" maw={300}>
                    Add your first tank to start tracking corals, photos, and your reef&apos;s progress.
                  </Text>
                  <Button component="a" href="/tanks/new" mt="xs">
                    Add your first tank
                  </Button>
                </Stack>
              </Paper>
            ) : (
              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                {tanksWithPhotos.map((tank) => (
                  <Card
                    key={tank.id}
                    component="a"
                    href={`/tanks/${tank.id}`}
                    className="tank-card"
                    p={0}
                    withBorder
                  >
                    <CardSection>
                      {tank.coverUrl ? (
                        <img
                          src={tank.coverUrl}
                          alt={tank.name}
                          style={{ width: "100%", height: 200, objectFit: "cover", display: "block" }}
                        />
                      ) : (
                        <div className="card-photo-placeholder" />
                      )}
                    </CardSection>
                    <Stack gap={6} p="md">
                      <Group justify="space-between" align="flex-start">
                        <Text fw={600}>{tank.name}</Text>
                        <Badge variant="light" color="teal" size="sm">{tank.type}</Badge>
                      </Group>
                      <Group gap={6}>
                        <Text size="xs" c="dimmed">{tank.volumeGal} gal</Text>
                        <Text size="xs" c="dimmed">·</Text>
                        <Text size="xs" c="dimmed">{tank._count.corals} coral{tank._count.corals !== 1 ? "s" : ""}</Text>
                      </Group>
                    </Stack>
                  </Card>
                ))}
              </SimpleGrid>
            )}
          </div>

          {/* Community Activity */}
          {communityFeed.length === 0 && followingIds.length === 0 && (
            <Paper withBorder p="lg">
              <Stack align="center" gap="sm" py="sm">
                <Text size="xl">🌊</Text>
                <Text fw={600}>Nothing in your feed yet</Text>
                <Text c="dimmed" size="sm" ta="center">
                  Follow other reefers to see their activity here.{" "}
                  <Anchor href="/users" c="teal">Browse the community →</Anchor>
                </Text>
              </Stack>
            </Paper>
          )}
          {communityFeed.length > 0 && (
            <Paper withBorder p="lg">
              <Group justify="space-between" align="center" mb="md">
                <Title order={3}>{followingIds.length > 0 ? "Following Activity" : "Community Activity"}</Title>
                <Anchor href="/users" size="sm" c="dimmed">Browse reefers →</Anchor>
              </Group>
              <Stack gap={0}>
                {communityFeed.map((ev, i) => {
                  const reefer = ev.coral.tank.user;
                  return (
                    <Group
                      key={ev.id}
                      gap="sm"
                      align="center"
                      py="xs"
                      style={{
                        borderBottom:
                          i < communityFeed.length - 1
                            ? "1px solid var(--mantine-color-default-border)"
                            : "none",
                      }}
                    >
                      <Anchor href={`/users/${reefer.username}`} style={{ flexShrink: 0 }}>
                        <Avatar src={reefer.avatarUrl} size={32} radius="xl">
                          {(reefer.displayName || reefer.username).slice(0, 1).toUpperCase()}
                        </Avatar>
                      </Anchor>
                      <Text size="sm" style={{ flex: 1 }}>
                        <Anchor href={`/users/${reefer.username}`} fw={500} c="inherit">
                          {reefer.displayName || `@${reefer.username}`}
                        </Anchor>{" "}
                        {EVENT_LABELS[ev.eventType]}{" "}
                        <Anchor
                          href={`/tanks/${ev.coral.tank.id}/corals/${ev.coral.id}`}
                          c="teal"
                        >
                          {ev.coral.name}
                        </Anchor>
                      </Text>
                      <Text size="xs" c="dimmed" style={{ flexShrink: 0 }}>
                        {relativeDate(ev.date)}
                      </Text>
                    </Group>
                  );
                })}
              </Stack>
            </Paper>
          )}
        </Stack>
      </Container>
    </>
  );
}
