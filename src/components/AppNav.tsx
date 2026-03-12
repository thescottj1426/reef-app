import { Container, Group, Title, Button } from "@mantine/core";
import { getAuthUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { UserMenu } from "./UserMenu";
import { NotificationBell } from "./NotificationBell";

export async function AppNav() {
  const { session, user } = await getAuthUser();

  const unreadCount = await prisma.notification.count({
    where: { userId: user.id, read: false },
  });

  return (
    <nav className="app-nav">
      <Container size="md">
        <Group justify="space-between" align="center" py="sm">
          <a href="/" style={{ textDecoration: "none", color: "inherit" }}>
            <Title order={4} style={{ letterSpacing: "-0.3px" }}>
              ReefBuilder
            </Title>
          </a>

          <Group gap="sm" align="center">
            <Button component="a" href="/" variant="subtle" size="sm" color="gray">
              Dashboard
            </Button>
            <Button component="a" href="/users" variant="subtle" size="sm" color="gray">
              Community
            </Button>
            <Button component="a" href="/frags" variant="subtle" size="sm" color="gray">
              Frags
            </Button>
            <Button component="a" href="/search" variant="subtle" size="sm" color="gray">
              Search
            </Button>
            <NotificationBell unreadCount={unreadCount} />
            <UserMenu
              displayName={user.displayName}
              username={user.username}
              avatarUrl={user.avatarUrl}
            />
          </Group>
        </Group>
      </Container>
    </nav>
  );
}
