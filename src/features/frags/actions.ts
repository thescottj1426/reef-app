"use server";

import { revalidatePath } from "next/cache";
import { getAuthUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import type { ListingStatus } from "@/generated/prisma";

export async function createFragListing(
  coralId: string,
  input: {
    price?: number;
    qty?: number;
    notes?: string;
  }
) {
  const { user } = await getAuthUser();

  // Verify coral belongs to this user
  const coral = await prisma.coral.findUnique({
    where: { id: coralId },
    select: { tank: { select: { user: { select: { id: true } } } } },
  });
  if (!coral || coral.tank.user.id !== user.id) {
    throw new Error("Coral not found");
  }

  await prisma.fragListing.create({
    data: {
      coralId,
      userId: user.id,
      price: input.price ?? null,
      qty: input.qty ?? 1,
      notes: input.notes?.trim() || null,
    },
  });

  revalidatePath(`/tanks`);
  revalidatePath(`/frags`);
}

export async function updateListingStatus(listingId: string, status: ListingStatus) {
  const { user } = await getAuthUser();

  const listing = await prisma.fragListing.findUnique({
    where: { id: listingId },
    select: { userId: true },
  });
  if (!listing || listing.userId !== user.id) {
    throw new Error("Listing not found");
  }

  await prisma.fragListing.update({ where: { id: listingId }, data: { status } });
  revalidatePath("/frags");
}

export async function deleteFragListing(listingId: string) {
  const { user } = await getAuthUser();

  const listing = await prisma.fragListing.findUnique({
    where: { id: listingId },
    select: { userId: true },
  });
  if (!listing || listing.userId !== user.id) {
    throw new Error("Listing not found");
  }

  await prisma.fragListing.delete({ where: { id: listingId } });
  revalidatePath("/frags");
}
