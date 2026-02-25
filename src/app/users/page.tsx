import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth/session";
import { AppNav } from "@/components/AppNav";
import { Box, Button, Card, Container, Group, SimpleGrid, Stack, Text, TextInput, Title } from "@mantine/core";

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
            { email: { contains: query, mode: "insensitive" } },
          ],
        }
      : undefined,
    select: {
      id: true,
      username: true,
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
          <Box>
            <Title order={3}>User Profiles</Title>
            <Text c="dimmed" size="sm" mt={4}>
              Search reef keepers and view their tank profiles.
            </Text>
          </Box>

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

          {users.length === 0 ? (
            <Text c="dimmed" size="sm">
              No users found.
            </Text>
          ) : (
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
              {users.map((user) => (
                <Card key={user.id} withBorder radius="md" p="md">
                  <Stack gap={6}>
                    <Title order={5}>@{user.username}</Title>
                    <Text c="dimmed" size="sm">
                      Tanks: {user._count.tanks}
                    </Text>
                    <Button
                      component={Link}
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
