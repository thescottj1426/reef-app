import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth/session";
import { AppNav } from "@/components/AppNav";
import { Avatar, Badge, Box, Button, Card, Container, Group, Paper, SimpleGrid, Stack, Text, TextInput, Title } from "@mantine/core";

type UsersPageProps = {
  searchParams?: Promise<{
    q?: string;
  }>;
};

export default async function UsersPage({ searchParams }: UsersPageProps) {
  await getAuthUser();

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const query = resolvedSearchParams?.q?.trim() ?? "";

  const users = await prisma.user.findMany({
    where: query
      ? {
          OR: [
            { username: { contains: query, mode: "insensitive" } },
            { displayName: { contains: query, mode: "insensitive" } },
            { location: { contains: query, mode: "insensitive" } },
            { email: { contains: query, mode: "insensitive" } },
          ],
        }
      : undefined,
    select: {
      id: true,
      username: true,
      displayName: true,
      location: true,
      bio: true,
      avatarUrl: true,
      createdAt: true,
      _count: { select: { tanks: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  return (
    <>
      <AppNav />
      <Container size="md" py="xl">
        <Stack gap="lg">
          <Paper withBorder p="lg">
            <Stack gap={4}>
              <Title order={3}>User Profiles</Title>
              <Text c="dimmed" size="sm">
                Search reef keepers and explore their public tank setups.
              </Text>
            </Stack>
          </Paper>

          <form action="/users" method="get">
            <Group align="end" wrap="nowrap">
              <TextInput
                name="q"
                label="Search"
                placeholder="Username or email"
                defaultValue={query}
                style={{ flex: 1 }}
              />
              <Button type="submit">Search</Button>
            </Group>
          </form>

          <Group justify="space-between" align="center">
            <Text c="dimmed" size="sm">
              {query ? `Results for "${query}"` : "Recently active members"}
            </Text>
            <Badge variant="light">{users.length}</Badge>
          </Group>

          {users.length === 0 ? (
            <Paper withBorder p="lg">
              <Text c="dimmed" size="sm">
                No users found. Try a different search term.
              </Text>
            </Paper>
          ) : (
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
              {users.map((user) => (
                <Card key={user.id} withBorder radius="md" p="md">
                  <Stack gap={8}>
                    <Group gap="sm" align="center">
                      <Avatar src={user.avatarUrl} radius="xl">
                        {(user.displayName || user.username).slice(0, 1).toUpperCase()}
                      </Avatar>
                      <Box>
                        <Title order={5}>{user.displayName || `@${user.username}`}</Title>
                        <Text c="dimmed" size="xs">
                          @{user.username}
                        </Text>
                      </Box>
                    </Group>
                    {user.location && (
                      <Text c="dimmed" size="sm">
                        {user.location}
                      </Text>
                    )}
                    {user.bio && (
                      <Text size="sm" lineClamp={2}>
                        {user.bio}
                      </Text>
                    )}
                    <Text c="dimmed" size="sm">
                      Tanks: {user._count.tanks}
                    </Text>
                    <Button
                      component="a"
                      href={`/users/${encodeURIComponent(user.username)}`}
                      variant="light"
                      size="xs"
                      mt="xs"
                    >
                      View profile
                    </Button>
                  </Stack>
                </Card>
              ))}
            </SimpleGrid>
          )}
        </Stack>
      </Container>
    </>
  );
}
