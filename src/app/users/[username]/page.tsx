import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth/session";
import { AppNav } from "@/components/AppNav";
import {
  Anchor,
  Avatar,
  Badge,
  Box,
  Card,
  Container,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { CoralEventType } from "@/generated/prisma";
import { FollowButton } from "@/features/social/components/FollowButton";

const TANK_TYPE_LABELS: Record<string, string> = {
  FOWLR: "FOWLR",
  REEF: "Reef",
  NANO: "Nano",
  PREDATOR: "Predator",
};

const EVENT_COLORS: Record<CoralEventType, string> = {
  ACQUIRED: "teal",
  FRAGGED: "cyan",
  SOLD: "orange",
  TRADED: "grape",
  GIFTED: "pink",
  OBSERVATION: "gray",
};

const EVENT_LABELS: Record<CoralEventType, string> = {
  ACQUIRED: "Acquired",
  FRAGGED: "Fragged",
  SOLD: "Sold",
  TRADED: "Traded",
  GIFTED: "Gifted",
  OBSERVATION: "Observed",
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

type ActivityItem = {
  id: string;
  date: Date | string;
  label: string;
  detail?: string;
  color: string;
  href: string;
};

type UserProfilePageProps = {
  params: Promise<{ username: string }>;
};

export default async function UserProfilePage({ params }: UserProfilePageProps) {
  const { user: currentUser } = await getAuthUser();
  const { username } = await params;

  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      displayName: true,
      location: true,
      bio: true,
      avatarUrl: true,
      createdAt: true,
      tanks: {
        select: {
          id: true,
          name: true,
          type: true,
          volumeGal: true,
          createdAt: true,
          _count: { select: { corals: true } },
          corals: {
            select: { id: true, name: true, createdAt: true },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!user) notFound();

  const isOwnProfile = currentUser.id === user.id;

  const [followerCount, followingCount, isFollowing] = await Promise.all([
    prisma.follow.count({ where: { followingId: user.id } }),
    prisma.follow.count({ where: { followerId: user.id } }),
    isOwnProfile
      ? Promise.resolve(false)
      : prisma.follow.findUnique({
          where: { followerId_followingId: { followerId: currentUser.id, followingId: user.id } },
        }).then(Boolean),
  ]);

  const ownershipEvents = await prisma.coralOwnershipEvent.findMany({
    where: { coral: { tank: { user: { username } } } },
    select: {
      id: true,
      eventType: true,
      date: true,
      source: true,
      coral: {
        select: {
          id: true,
          name: true,
          tank: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { date: "desc" },
  });

  // Build unified activity feed
  const activities: ActivityItem[] = [];

  for (const tank of user.tanks) {
    activities.push({
      id: `tank-${tank.id}`,
      date: tank.createdAt,
      label: `Set up "${tank.name}"`,
      detail: `${tank.volumeGal} gal · ${TANK_TYPE_LABELS[tank.type] ?? tank.type}`,
      color: "blue",
      href: `/tanks/${tank.id}`,
    });
    for (const coral of tank.corals) {
      activities.push({
        id: `coral-${coral.id}`,
        date: coral.createdAt,
        label: `Added "${coral.name}"`,
        detail: `to ${tank.name}`,
        color: "teal",
        href: `/tanks/${tank.id}/corals/${coral.id}`,
      });
    }
  }

  for (const ev of ownershipEvents) {
    activities.push({
      id: `ev-${ev.id}`,
      date: ev.date,
      label: `${EVENT_LABELS[ev.eventType]} "${ev.coral.name}"`,
      detail: ev.source || ev.coral.tank.name,
      color: EVENT_COLORS[ev.eventType],
      href: `/tanks/${ev.coral.tank.id}/corals/${ev.coral.id}`,
    });
  }

  activities.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  const feed = activities.slice(0, 30);

  // Stats
  const totalCorals = user.tanks.reduce((s, t) => s + t._count.corals, 0);
  const fragsCount = ownershipEvents.filter((e) => e.eventType === "FRAGGED").length;
  const firstTank = user.tanks[0];
  const monthsReefing = firstTank
    ? Math.floor(
        (Date.now() - new Date(firstTank.createdAt).getTime()) /
          (1000 * 60 * 60 * 24 * 30)
      )
    : 0;

  return (
    <>
      <AppNav />
      <Container size="md" py="xl">
        <Stack gap="lg">
          {/* Profile header */}
          <Paper withBorder p="lg">
            <Group align="flex-start" gap="md">
              <Avatar src={user.avatarUrl} radius="xl" size={72}>
                {(user.displayName || user.username).slice(0, 1).toUpperCase()}
              </Avatar>
              <Stack gap={4} style={{ flex: 1 }}>
                <Title order={3}>{user.displayName || `@${user.username}`}</Title>
                <Text c="dimmed" size="sm">@{user.username}</Text>
                {user.location && (
                  <Text c="dimmed" size="sm">{user.location}</Text>
                )}
                {user.bio && <Text size="sm">{user.bio}</Text>}
                <Text c="dimmed" size="xs" mt={4}>
                  Member since{" "}
                  {new Intl.DateTimeFormat("en-US", {
                    month: "short",
                    year: "numeric",
                  }).format(user.createdAt)}
                </Text>
                {!isOwnProfile && (
                  <FollowButton
                    targetUserId={user.id}
                    initialFollowing={isFollowing}
                    revalidate={`/users/${username}`}
                  />
                )}
              </Stack>
            </Group>
          </Paper>

          {/* Journey stats */}
          <SimpleGrid cols={{ base: 3, sm: 6 }} spacing="sm">
            <Paper withBorder p="md" ta="center">
              <Text size="xl" fw={700}>{user.tanks.length}</Text>
              <Text size="xs" c="dimmed" tt="uppercase">Tanks</Text>
            </Paper>
            <Paper withBorder p="md" ta="center">
              <Text size="xl" fw={700}>{totalCorals}</Text>
              <Text size="xs" c="dimmed" tt="uppercase">Corals</Text>
            </Paper>
            <Paper withBorder p="md" ta="center">
              <Text size="xl" fw={700}>{fragsCount}</Text>
              <Text size="xs" c="dimmed" tt="uppercase">Frags Made</Text>
            </Paper>
            <Paper withBorder p="md" ta="center">
              <Text size="xl" fw={700}>{monthsReefing}</Text>
              <Text size="xs" c="dimmed" tt="uppercase">Months Reefing</Text>
            </Paper>
            <Paper withBorder p="md" ta="center">
              <Text size="xl" fw={700}>{followerCount}</Text>
              <Text size="xs" c="dimmed" tt="uppercase">Followers</Text>
            </Paper>
            <Paper withBorder p="md" ta="center">
              <Text size="xl" fw={700}>{followingCount}</Text>
              <Text size="xs" c="dimmed" tt="uppercase">Following</Text>
            </Paper>
          </SimpleGrid>

          {/* Tanks */}
          <Box>
            <Group justify="space-between" align="center" mb="sm">
              <Title order={4}>Tanks</Title>
              <Badge variant="light">{user.tanks.length}</Badge>
            </Group>
            {user.tanks.length === 0 ? (
              <Text c="dimmed" size="sm">No tanks added yet.</Text>
            ) : (
              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                {[...user.tanks].reverse().map((tank) => (
                  <Card
                    key={tank.id}
                    component="a"
                    href={`/tanks/${tank.id}`}
                    className="tank-card"
                    p="md"
                  >
                    <Group justify="space-between" align="flex-start">
                      <Text fw={600}>{tank.name}</Text>
                      <Badge variant="light" color="teal">
                        {TANK_TYPE_LABELS[tank.type] ?? tank.type}
                      </Badge>
                    </Group>
                    <Text c="dimmed" size="sm" mt={6}>
                      {tank.volumeGal} gal · {tank._count.corals} coral
                      {tank._count.corals !== 1 ? "s" : ""}
                    </Text>
                  </Card>
                ))}
              </SimpleGrid>
            )}
          </Box>

          {/* Reef Journey feed */}
          {feed.length > 0 && (
            <Paper withBorder p="lg">
              <Title order={4} mb="md">Reef Journey</Title>
              <Stack gap={0}>
                {feed.map((item, i) => (
                  <Group
                    key={item.id}
                    gap="sm"
                    align="flex-start"
                    py="xs"
                    style={{
                      borderBottom:
                        i < feed.length - 1
                          ? "1px solid var(--mantine-color-default-border)"
                          : "none",
                    }}
                  >
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        backgroundColor: `var(--mantine-color-${item.color}-6)`,
                        marginTop: 6,
                        flexShrink: 0,
                      }}
                    />
                    <Box style={{ flex: 1 }}>
                      <Anchor href={item.href} size="sm" fw={500} c="inherit">
                        {item.label}
                      </Anchor>
                      {item.detail && (
                        <Text size="xs" c="dimmed">{item.detail}</Text>
                      )}
                    </Box>
                    <Text
                      size="xs"
                      c="dimmed"
                      style={{ flexShrink: 0, marginTop: 2 }}
                    >
                      {relativeDate(item.date)}
                    </Text>
                  </Group>
                ))}
              </Stack>
            </Paper>
          )}
        </Stack>
      </Container>
    </>
  );
}
