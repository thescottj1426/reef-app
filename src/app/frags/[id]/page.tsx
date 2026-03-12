import { notFound } from "next/navigation";
import { getAuthUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { AppNav } from "@/components/AppNav";
import {
  Container,
  Title,
  Text,
  Stack,
  Group,
  Badge,
  Button,
  Paper,
  Avatar,
  Anchor,
} from "@mantine/core";
import { ManageListingButton } from "@/features/frags/components/ManageListingButton";

export default async function FragListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { user } = await getAuthUser();

  const listing = await prisma.fragListing.findUnique({
    where: { id },
    select: {
      id: true,
      price: true,
      qty: true,
      notes: true,
      status: true,
      createdAt: true,
      userId: true,
      coral: {
        select: {
          id: true,
          name: true,
          species: true,
          notes: true,
          tank: {
            select: {
              id: true,
              name: true,
              user: {
                select: {
                  id: true,
                  username: true,
                  displayName: true,
                  avatarUrl: true,
                  location: true,
                  bio: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!listing) notFound();

  const isOwner = listing.userId === user.id;
  const seller = listing.coral.tank.user;

  const STATUS_COLOR = {
    AVAILABLE: "teal",
    PENDING: "yellow",
    SOLD: "gray",
  } as const;

  return (
    <>
      <AppNav />
      <Container size="sm" py="xl">
        <Stack gap="lg">
          <Group mb="xs">
            <Button component="a" href="/frags" variant="subtle" size="sm" color="gray">
              ← Frag Board
            </Button>
          </Group>

          <Paper withBorder p="lg">
            <Stack gap="md">
              <Group justify="space-between" align="flex-start">
                <div>
                  <Title order={3}>{listing.coral.name}</Title>
                  {listing.coral.species && (
                    <Text c="dimmed" size="sm" style={{ fontStyle: "italic" }}>
                      {listing.coral.species}
                    </Text>
                  )}
                </div>
                <Group gap="xs">
                  <Badge color={STATUS_COLOR[listing.status]} variant="light">
                    {listing.status}
                  </Badge>
                  <Badge color="teal" variant="filled" size="lg">
                    {listing.price != null ? `$${listing.price.toFixed(2)}` : "Free / Trade"}
                  </Badge>
                </Group>
              </Group>

              <Group gap="md">
                <Text size="sm"><strong>Qty available:</strong> {listing.qty}</Text>
                <Text size="sm">
                  <strong>Listed:</strong>{" "}
                  {new Date(listing.createdAt).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </Text>
              </Group>

              {listing.notes && (
                <Stack gap={2}>
                  <Text size="xs" c="dimmed" fw={500} tt="uppercase">Notes</Text>
                  <Text size="sm">{listing.notes}</Text>
                </Stack>
              )}

              {listing.coral.notes && (
                <Stack gap={2}>
                  <Text size="xs" c="dimmed" fw={500} tt="uppercase">About This Coral</Text>
                  <Text size="sm">{listing.coral.notes}</Text>
                </Stack>
              )}

              <Anchor href={`/tanks/${listing.coral.tank.id}/corals/${listing.coral.id}`} size="sm">
                View full coral page →
              </Anchor>
            </Stack>
          </Paper>

          {/* Seller info */}
          <Paper withBorder p="lg">
            <Text fw={600} mb="sm">Seller</Text>
            <Group gap="md" align="flex-start">
              <Avatar src={seller.avatarUrl} size={48} radius="xl">
                {(seller.displayName || seller.username).slice(0, 1).toUpperCase()}
              </Avatar>
              <Stack gap={4}>
                <Anchor href={`/users/${seller.username}`} fw={600} c="inherit">
                  {seller.displayName || `@${seller.username}`}
                </Anchor>
                <Text size="xs" c="dimmed">@{seller.username}</Text>
                {seller.location && <Text size="xs" c="dimmed">{seller.location}</Text>}
                {seller.bio && <Text size="sm">{seller.bio}</Text>}
              </Stack>
            </Group>
            {!isOwner && (
              <Button
                component="a"
                href={`/users/${seller.username}`}
                variant="light"
                size="sm"
                mt="md"
              >
                View {seller.displayName || `@${seller.username}`}&apos;s Profile
              </Button>
            )}
          </Paper>

          {/* Owner controls */}
          {isOwner && (
            <Paper withBorder p="lg">
              <Text fw={600} mb="sm">Manage Listing</Text>
              <ManageListingButton
                listingId={listing.id}
                currentStatus={listing.status}
              />
            </Paper>
          )}
        </Stack>
      </Container>
    </>
  );
}
