import { redirect } from "next/navigation";
import { auth0 } from "@/lib/auth0";
import { prisma } from "@/lib/prisma";
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
} from "@mantine/core";

export default async function HomePage() {
  const session = await auth0.getSession();
  if (!session) {
    redirect("/login");
  }

  const dbUser = await prisma.user.findUnique({
    where: { auth0Id: session.user.sub },
    select: {
      tanks: {
        select: { id: true, name: true, type: true, volumeGal: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  const tanks = dbUser?.tanks ?? [];

  return (
    <Container size="md" py="xl">
      <Stack>
        <Group justify="space-between" align="center">
          <Title order={2}>ReefBuilder</Title>
          <Button component="a" href="/auth/logout" variant="subtle" size="sm">
            Sign out
          </Button>
        </Group>

        <Text>Welcome, {session.user.name ?? session.user.email}!</Text>

        <Group justify="space-between" align="center" mt="lg">
          <Title order={3}>My Tanks</Title>
          <Button component="a" href="/tanks/new" size="sm">
            Add tank
          </Button>
        </Group>

        {tanks.length === 0 ? (
          <Text c="dimmed" size="sm">
            You haven&apos;t added any tanks yet.
          </Text>
        ) : (
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            {tanks.map((tank) => (
              <Card
                key={tank.id}
                withBorder
                radius="md"
                p="md"
                component="a"
                href={`/tanks/${tank.id}`}
                style={{ textDecoration: "none" }}
              >
                <Group justify="space-between" align="flex-start">
                  <Text fw={500}>{tank.name}</Text>
                  <Badge variant="light">{tank.type}</Badge>
                </Group>
                <Text c="dimmed" size="sm" mt={4}>
                  {tank.volumeGal} gal
                </Text>
              </Card>
            ))}
          </SimpleGrid>
        )}
      </Stack>
    </Container>
  );
}
