import { getAuthUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { AppNav } from "@/components/AppNav";
import {
  Container,
  Title,
  Text,
  Button,
  Stack,
  Group,
  Card,
  SimpleGrid,
  Badge,
  Box,
  Paper,
} from "@mantine/core";

export default async function HomePage() {
  const { user } = await getAuthUser();

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      tanks: {
        select: { id: true, name: true, type: true, volumeGal: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  const tanks = dbUser?.tanks ?? [];

  return (
    <>
      <AppNav />
      <Container size="md" py="xl">
        <Stack gap="xl">
          <Paper p="lg" withBorder>
            <Group justify="space-between" align="center">
              <Box>
                <Title order={2}>Welcome back</Title>
                <Text c="dimmed" size="sm" mt={4}>
                  Manage your tanks and track coral growth in one place.
                </Text>
              </Box>
              <Button component="a" href="/tanks/new" size="sm">
                Add tank
              </Button>
            </Group>
          </Paper>

          <Box>
            <Group justify="space-between" align="center" mb="sm">
              <Title order={3}>My Tanks</Title>
              <Badge variant="light" size="lg">
                {tanks.length}
              </Badge>
            </Group>

            {tanks.length === 0 ? (
              <Paper withBorder p="lg">
                <Stack gap={8}>
                  <Text fw={600}>No tanks yet</Text>
                  <Text c="dimmed" size="sm">
                    Add your first tank to start tracking corals, photos, and setup details.
                  </Text>
                  <Button component="a" href="/tanks/new" size="xs" w="fit-content">
                    Create first tank
                  </Button>
                </Stack>
              </Paper>
            ) : (
              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                {tanks.map((tank) => (
                  <Card
                    key={tank.id}
                    component="a"
                    href={`/tanks/${tank.id}`}
                    className="tank-card"
                    p="md"
                  >
                    <Group justify="space-between" align="flex-start">
                      <Text fw={600} size="md">{tank.name}</Text>
                      <Badge variant="light" color="teal">{tank.type}</Badge>
                    </Group>
                    <Text c="dimmed" size="sm" mt={6}>
                      {tank.volumeGal} gal
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
