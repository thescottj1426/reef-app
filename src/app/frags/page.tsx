import { getAuthUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { AppNav } from "@/components/AppNav";
import {
  Container,
  Title,
  Text,
  Stack,
  SimpleGrid,
  Card,
  Group,
  Badge,
  Avatar,
  Paper,
} from "@mantine/core";

const categoryColors: Record<string, string> = {
  SPS: "red", LPS: "teal", SOFTIE: "violet",
  ZOA: "yellow", ANEMONE: "pink", OTHER: "gray",
};

export default async function FragsPage() {
  await getAuthUser();

  const listings = await prisma.fragListing.findMany({
    where: { status: "AVAILABLE" },
    select: {
      id: true,
      price: true,
      qty: true,
      notes: true,
      createdAt: true,
      coral: {
        select: {
          id: true,
          name: true,
          species: true,
          category: true,
          tank: {
            select: {
              id: true,
              user: {
                select: {
                  username: true,
                  displayName: true,
                  avatarUrl: true,
                  location: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <>
      <AppNav />
      <Container size="md" py="xl">
        <Stack gap="lg">
          <Paper withBorder p="lg">
            <Stack gap={4}>
              <Title order={3}>🪸 Frag Board</Title>
              <Text c="dimmed" size="sm">
                Browse available frags from the community. Contact sellers through their profile.
              </Text>
            </Stack>
          </Paper>

          {listings.length === 0 ? (
            <Paper withBorder p="xl">
              <Stack align="center" gap="sm">
                <Text size="2rem">🌊</Text>
                <Text fw={600}>No frags listed yet</Text>
                <Text c="dimmed" size="sm" ta="center" maw={300}>
                  When reefers frag their corals they can list them here. Add corals to your
                  collection to start listing frags.
                </Text>
              </Stack>
            </Paper>
          ) : (
            <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
              {listings.map((listing) => {
                const seller = listing.coral.tank.user;
                return (
                  <Card key={listing.id} withBorder p="md" component="a" href={`/frags/${listing.id}`} className="tank-card">
                    <Stack gap="xs">
                      <Group justify="space-between" align="flex-start">
                        <Stack gap={2} style={{ flex: 1 }}>
                          <Text fw={600} size="sm">{listing.coral.name}</Text>
                          {listing.coral.species && (
                            <Text size="xs" c="dimmed" style={{ fontStyle: "italic" }}>
                              {listing.coral.species}
                            </Text>
                          )}
                        </Stack>
                        <Group gap={4}>
                          {listing.coral.category && (
                            <Badge variant="light" color={categoryColors[listing.coral.category]} size="sm">
                              {listing.coral.category}
                            </Badge>
                          )}
                          <Badge variant="light" color="teal" size="sm">
                            {listing.price != null ? `$${listing.price.toFixed(2)}` : "Free / Trade"}
                          </Badge>
                        </Group>
                      </Group>

                      {listing.notes && (
                        <Text size="xs" c="dimmed" lineClamp={2}>{listing.notes}</Text>
                      )}

                      <Group gap="xs" align="center" mt="xs">
                        <Avatar src={seller.avatarUrl} size={20} radius="xl">
                          {(seller.displayName || seller.username).slice(0, 1).toUpperCase()}
                        </Avatar>
                        <Text size="xs" c="dimmed">
                          {seller.displayName || `@${seller.username}`}
                        </Text>
                        {seller.location && (
                          <Text size="xs" c="dimmed">· {seller.location}</Text>
                        )}
                      </Group>

                      <Group gap="xs">
                        <Badge variant="outline" size="xs" color="gray">
                          Qty: {listing.qty}
                        </Badge>
                        <Text size="xs" c="dimmed">
                          Listed {new Date(listing.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </Text>
                      </Group>
                    </Stack>
                  </Card>
                );
              })}
            </SimpleGrid>
          )}
        </Stack>
      </Container>
    </>
  );
}
