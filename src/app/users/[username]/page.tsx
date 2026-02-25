import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth/session";
import { AppNav } from "@/components/AppNav";
import { Avatar, Badge, Box, Card, Container, Group, Paper, SimpleGrid, Stack, Text, Title } from "@mantine/core";

type UserProfilePageProps = {
  params: Promise<{ username: string }>;
};

export default async function UserProfilePage({ params }: UserProfilePageProps) {
  await getAuthUser();
  const { username } = await params;

  const user = await prisma.user.findUnique({
    where: { username },
    select: {
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
          _count: { select: { corals: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!user) {
    notFound();
  }

  return (
    <>
      <AppNav />
      <Container size="md" py="xl">
        <Stack gap="lg">
          <Paper withBorder p="lg">
            <Group align="flex-start" gap="md">
              <Avatar src={user.avatarUrl} radius="xl" size={72}>
                {(user.displayName || user.username).slice(0, 1).toUpperCase()}
              </Avatar>
              <Stack gap={4}>
                <Title order={3}>{user.displayName || `@${user.username}`}</Title>
                <Text c="dimmed" size="sm">
                  @{user.username}
                </Text>
                {user.location && (
                  <Text c="dimmed" size="sm">
                    {user.location}
                  </Text>
                )}
                <Text c="dimmed" size="sm">
                  Member since {new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric" }).format(user.createdAt)}
                </Text>
                {user.bio && <Text size="sm">{user.bio}</Text>}
              </Stack>
            </Group>
          </Paper>

          <Box>
            <Group justify="space-between" align="center" mb="sm">
              <Title order={4}>Tanks</Title>
              <Badge variant="light">{user.tanks.length}</Badge>
            </Group>

            {user.tanks.length === 0 ? (
              <Text c="dimmed" size="sm">
                No tanks added yet.
              </Text>
            ) : (
              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                {user.tanks.map((tank) => (
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
                        {tank.type}
                      </Badge>
                    </Group>
                    <Text c="dimmed" size="sm" mt={6}>
                      {tank.volumeGal} gal • {tank._count.corals} corals
                    </Text>
                  </Card>
                ))}
              </SimpleGrid>
            )}
          </Box>
        </Stack>
      </Container>
    </>
  );
}
