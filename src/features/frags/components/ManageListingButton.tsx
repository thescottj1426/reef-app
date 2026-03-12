"use client";

import { useState } from "react";
import { Group, Button, Text } from "@mantine/core";
import { updateListingStatus, deleteFragListing } from "@/features/frags/actions";
import type { ListingStatus } from "@/generated/prisma";
import { useRouter } from "next/navigation";

interface ManageListingButtonProps {
  listingId: string;
  currentStatus: ListingStatus;
}

export function ManageListingButton({ listingId, currentStatus }: ManageListingButtonProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handle(action: string) {
    setLoading(action);
    setError(null);
    try {
      if (action === "pending") await updateListingStatus(listingId, "PENDING");
      if (action === "available") await updateListingStatus(listingId, "AVAILABLE");
      if (action === "sold") await updateListingStatus(listingId, "SOLD");
      if (action === "delete") {
        await deleteFragListing(listingId);
        router.push("/frags");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(null);
    }
  }

  return (
    <Group gap="xs" wrap="wrap">
      {error && <Text size="xs" c="red">{error}</Text>}
      {currentStatus === "AVAILABLE" && (
        <Button
          variant="light"
          color="yellow"
          size="sm"
          loading={loading === "pending"}
          onClick={() => handle("pending")}
        >
          Mark Pending
        </Button>
      )}
      {currentStatus === "PENDING" && (
        <>
          <Button
            variant="light"
            color="teal"
            size="sm"
            loading={loading === "available"}
            onClick={() => handle("available")}
          >
            Mark Available
          </Button>
          <Button
            variant="light"
            color="gray"
            size="sm"
            loading={loading === "sold"}
            onClick={() => handle("sold")}
          >
            Mark Sold
          </Button>
        </>
      )}
      <Button
        variant="subtle"
        color="red"
        size="sm"
        loading={loading === "delete"}
        onClick={() => handle("delete")}
      >
        Remove Listing
      </Button>
    </Group>
  );
}
