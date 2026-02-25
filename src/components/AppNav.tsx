import { Container, Group, Text, Button, Title } from "@mantine/core";
import { getAuthUser } from "@/lib/auth/session";

export async function AppNav() {
  const { session } = await getAuthUser();

  return (
    <nav className="app-nav">
      <Container size="md">
        <Group justify="space-between" align="center" py="sm">
          <a href="/" style={{ textDecoration: "none", color: "inherit" }}>
            <Title order={4} style={{ letterSpacing: "-0.3px" }}>
              ReefBuilder
            </Title>
          </a>
          <Group gap="xs" align="center">
            <Button component="a" href="/" variant="subtle" size="xs" color="gray">
              Dashboard
            </Button>
            <Button component="a" href="/users" variant="subtle" size="xs" color="gray">
              Profiles
            </Button>
            <Button component="a" href="/settings/profile" variant="subtle" size="xs" color="gray">
              Edit Profile
            </Button>
            <Text size="sm" c="dimmed">
              {session.user.name ?? session.user.email}
            </Text>
            <Button component="a" href="/auth/sign-out" variant="subtle" size="xs" color="gray">
              Sign out
            </Button>
          </Group>
        </Group>
      </Container>
    </nav>
  );
}
