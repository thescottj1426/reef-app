import { getAuthUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { AppNav } from "@/components/AppNav";
import { Container, Title, Paper, Stack, Text, Group, Avatar, Badge } from "@mantine/core";

function relativeDate(date: Date | string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

function notifLabel(type: string, targetType?: string | null): string {
  if (type === "LIKE") return `liked your ${targetType?.toLowerCase() ?? "post"}`;
  if (type === "COMMENT") return `commented on your ${targetType?.toLowerCase() ?? "post"}`;
  if (type === "FOLLOW") return "started following you";
  return "interacted with you";
}

function notifHref(type: string, targetType?: string | null, targetId?: string | null, fromUsername?: string | null): string {
  if (type === "FOLLOW" && fromUsername) return `/users/${fromUsername}`;
  if (type === "LIKE" || type === "COMMENT") {
    if (targetType === "TANK" && targetId) return `/tanks/${targetId}`;
    if (targetType === "CORAL" && targetId) {
      // We don't have tankId here, link to search or just "#"
      return "#";
    }
  }
  return "#";
}

export default async function NotificationsPage() {
  const { user } = await getAuthUser();

  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    include: {
      fromUser: { select: { username: true, displayName: true, avatarUrl: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  // Mark all as read
  await prisma.notification.updateMany({
    where: { userId: user.id, read: false },
    data: { read: true },
  });

  return (
    <>
      <AppNav />
      <Container size="sm" py="xl">
        <Stack gap="lg">
          <Title order={3}>Notifications</Title>

          {notifications.length === 0 ? (
            <Paper withBorder p="xl">
              <Stack align="center" gap="sm">
                <Text size="2rem">🔔</Text>
                <Text fw={600}>No notifications yet</Text>
                <Text c="dimmed" size="sm" ta="center">
                  When someone likes or comments on your tanks and corals, you&apos;ll see it here.
                </Text>
              </Stack>
            </Paper>
          ) : (
            <Paper withBorder>
              <Stack gap={0}>
                {notifications.map((n, i) => {
                  const from = n.fromUser;
                  const name = from?.displayName || (from?.username ? `@${from.username}` : "Someone");
                  const href = notifHref(n.type, n.targetType, n.targetId, from?.username);
                  return (
                    <a
                      key={n.id}
                      href={href}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "12px 16px",
                        textDecoration: "none",
                        color: "inherit",
                        borderBottom: i < notifications.length - 1 ? "1px solid var(--mantine-color-default-border)" : "none",
                        backgroundColor: n.read ? undefined : "var(--mantine-color-blue-0)",
                      }}
                    >
                      <Avatar src={from?.avatarUrl} size={36} radius="xl">
                        {name.slice(0, 1).toUpperCase()}
                      </Avatar>
                      <Stack gap={2} style={{ flex: 1 }}>
                        <Text size="sm">
                          <strong>{name}</strong> {notifLabel(n.type, n.targetType)}
                        </Text>
                      </Stack>
                      <Group gap={6} align="center">
                        {!n.read && <Badge size="xs" color="blue" variant="filled">New</Badge>}
                        <Text size="xs" c="dimmed">{relativeDate(n.createdAt)}</Text>
                      </Group>
                    </a>
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
