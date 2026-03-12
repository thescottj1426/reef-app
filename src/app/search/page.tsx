import { getAuthUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { AppNav } from "@/components/AppNav";
import {
  Container,
  Title,
  Text,
  Stack,
  Paper,
  Group,
  Avatar,
  Badge,
  SimpleGrid,
  Card,
  TextInput,
  Button,
} from "@mantine/core";

const categoryColors: Record<string, string> = {
  SPS: "red", LPS: "teal", SOFTIE: "violet",
  ZOA: "yellow", ANEMONE: "pink", OTHER: "gray",
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await getAuthUser();
  const { q } = await searchParams;
  const query = (q ?? "").trim();

  const [users, corals, frags] = query.length >= 2
    ? await Promise.all([
        prisma.user.findMany({
          where: {
            OR: [
              { username: { contains: query, mode: "insensitive" } },
              { displayName: { contains: query, mode: "insensitive" } },
            ],
          },
          select: { id: true, username: true, displayName: true, avatarUrl: true, location: true },
          take: 5,
        }),
        prisma.coral.findMany({
          where: {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { species: { contains: query, mode: "insensitive" } },
            ],
          },
          select: {
            id: true,
            name: true,
            species: true,
            category: true,
            tank: { select: { id: true, user: { select: { username: true } } } },
          },
          take: 8,
        }),
        prisma.fragListing.findMany({
          where: {
            status: "AVAILABLE",
            coral: {
              OR: [
                { name: { contains: query, mode: "insensitive" } },
                { species: { contains: query, mode: "insensitive" } },
              ],
            },
          },
          select: {
            id: true,
            price: true,
            qty: true,
            coral: {
              select: {
                id: true,
                name: true,
                category: true,
                tank: { select: { id: true, user: { select: { username: true, displayName: true } } } },
              },
            },
          },
          take: 5,
        }),
      ])
    : [[], [], []];

  return (
    <>
      <AppNav />
      <Container size="md" py="xl">
        <Stack gap="lg">
          <form method="GET" action="/search">
            <Group gap="sm">
              <TextInput
                name="q"
                defaultValue={query}
                placeholder="Search reefers, corals, frags..."
                style={{ flex: 1 }}
                autoFocus
              />
              <Button type="submit">Search</Button>
            </Group>
          </form>

          {query.length < 2 ? (
            <Paper withBorder p="xl">
              <Stack align="center" gap="sm">
                <Text size="2rem">🔍</Text>
                <Text fw={600}>Search ReefBuilder</Text>
                <Text c="dimmed" size="sm" ta="center">
                  Find reefers, corals, and available frags.
                </Text>
              </Stack>
            </Paper>
          ) : (
            <>
              {users.length === 0 && corals.length === 0 && frags.length === 0 && (
                <Paper withBorder p="xl">
                  <Stack align="center" gap="sm">
                    <Text size="2rem">🌊</Text>
                    <Text fw={600}>No results for &quot;{query}&quot;</Text>
                  </Stack>
                </Paper>
              )}

              {users.length > 0 && (
                <Stack gap="sm">
                  <Title order={4}>Reefers</Title>
                  <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                    {users.map((u) => (
                      <Card key={u.id} component="a" href={`/users/${u.username}`} className="tank-card" p="md" withBorder>
                        <Group gap="sm">
                          <Avatar src={u.avatarUrl} radius="xl" size={40}>
                            {(u.displayName || u.username).slice(0, 1).toUpperCase()}
                          </Avatar>
                          <Stack gap={2}>
                            <Text fw={600} size="sm">{u.displayName || `@${u.username}`}</Text>
                            <Text size="xs" c="dimmed">@{u.username}{u.location ? ` · ${u.location}` : ""}</Text>
                          </Stack>
                        </Group>
                      </Card>
                    ))}
                  </SimpleGrid>
                </Stack>
              )}

              {corals.length > 0 && (
                <Stack gap="sm">
                  <Title order={4}>Corals</Title>
                  <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                    {corals.map((c) => (
                      <Card key={c.id} component="a" href={`/tanks/${c.tank.id}/corals/${c.id}`} className="tank-card" p="md" withBorder>
                        <Group justify="space-between" align="flex-start">
                          <Stack gap={2}>
                            <Text fw={600} size="sm">{c.name}</Text>
                            {c.species && <Text size="xs" c="dimmed" fs="italic">{c.species}</Text>}
                            <Text size="xs" c="dimmed">by @{c.tank.user.username}</Text>
                          </Stack>
                          {c.category && (
                            <Badge size="sm" variant="light" color={categoryColors[c.category]}>
                              {c.category}
                            </Badge>
                          )}
                        </Group>
                      </Card>
                    ))}
                  </SimpleGrid>
                </Stack>
              )}

              {frags.length > 0 && (
                <Stack gap="sm">
                  <Title order={4}>Available Frags</Title>
                  <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                    {frags.map((f) => (
                      <Card key={f.id} component="a" href={`/frags/${f.id}`} className="tank-card" p="md" withBorder>
                        <Group justify="space-between" align="flex-start">
                          <Stack gap={2}>
                            <Text fw={600} size="sm">{f.coral.name}</Text>
                            <Text size="xs" c="dimmed">by @{f.coral.tank.user.username}</Text>
                          </Stack>
                          <Group gap={4}>
                            {f.coral.category && (
                              <Badge size="sm" variant="light" color={categoryColors[f.coral.category]}>
                                {f.coral.category}
                              </Badge>
                            )}
                            <Badge size="sm" variant="light" color="teal">
                              {f.price != null ? `$${f.price.toFixed(2)}` : "Free"}
                            </Badge>
                          </Group>
                        </Group>
                      </Card>
                    ))}
                  </SimpleGrid>
                </Stack>
              )}
            </>
          )}
        </Stack>
      </Container>
    </>
  );
}
