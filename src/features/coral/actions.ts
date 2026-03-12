"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getAuthUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { s3 } from "@/lib/s3";
import type { CoralPlacement, LightingLevel, FlowLevel, CoralEventType, CoralCategory } from "@/generated/prisma";

const BUCKET = process.env.AWS_S3_BUCKET!;
const REGION = process.env.AWS_REGION!;

async function verifyTankOwnership(tankId: string, neonAuthId: string) {
  const tank = await prisma.tank.findUnique({
    where: { id: tankId },
    select: { user: { select: { neonAuthId: true } } },
  });
  if (!tank || tank.user.neonAuthId !== neonAuthId) {
    throw new Error("Tank not found");
  }
}

async function verifyCoralOwnership(coralId: string, neonAuthId: string) {
  const coral = await prisma.coral.findUnique({
    where: { id: coralId },
    select: { tankId: true, tank: { select: { user: { select: { neonAuthId: true } } } } },
  });
  if (!coral || coral.tank.user.neonAuthId !== neonAuthId) {
    throw new Error("Coral not found");
  }
  return coral;
}

export async function createCoral(
  tankId: string,
  input: {
    name: string;
    species?: string;
    category?: CoralCategory;
    placement?: CoralPlacement;
    lighting?: LightingLevel;
    flow?: FlowLevel;
    acquiredDate?: string;
    notes?: string;
  }
) {
  const { session } = await getAuthUser();
  await verifyTankOwnership(tankId, session.user.id);

  const coral = await prisma.coral.create({
    data: {
      tankId,
      name: input.name,
      species: input.species || null,
      category: input.category || null,
      placement: input.placement || null,
      lighting: input.lighting || null,
      flow: input.flow || null,
      acquiredDate: input.acquiredDate ? new Date(input.acquiredDate) : null,
      notes: input.notes || null,
    },
  });

  revalidatePath(`/tanks/${tankId}`);
  redirect(`/tanks/${tankId}/corals/${coral.id}`);
}

export async function updateCoral(
  coralId: string,
  input: {
    name: string;
    species?: string;
    category?: CoralCategory;
    placement?: CoralPlacement;
    lighting?: LightingLevel;
    flow?: FlowLevel;
    acquiredDate?: string;
    notes?: string;
  }
) {
  const { session } = await getAuthUser();
  const coral = await verifyCoralOwnership(coralId, session.user.id);

  await prisma.coral.update({
    where: { id: coralId },
    data: {
      name: input.name,
      species: input.species || null,
      category: input.category || null,
      placement: input.placement || null,
      lighting: input.lighting || null,
      flow: input.flow || null,
      acquiredDate: input.acquiredDate ? new Date(input.acquiredDate) : null,
      notes: input.notes || null,
    },
  });

  revalidatePath(`/tanks/${coral.tankId}/corals/${coralId}`);
  redirect(`/tanks/${coral.tankId}/corals/${coralId}`);
}

export async function deleteCoral(coralId: string) {
  const { session } = await getAuthUser();
  const coral = await verifyCoralOwnership(coralId, session.user.id);

  await prisma.coral.delete({ where: { id: coralId } });
  redirect(`/tanks/${coral.tankId}`);
}

export async function getPresignedCoralUploadUrl(
  coralId: string,
  filename: string,
  contentType: string
) {
  const { session } = await getAuthUser();
  const coral = await verifyCoralOwnership(coralId, session.user.id);

  const s3Key = `corals/${coralId}/${randomUUID()}-${filename}`;
  const presignedUrl = await getSignedUrl(
    s3,
    new PutObjectCommand({ Bucket: BUCKET, Key: s3Key, ContentType: contentType }),
    { expiresIn: 60 }
  );

  return { presignedUrl, s3Key, tankId: coral.tankId };
}

export async function saveCoralPhoto(coralId: string, s3Key: string) {
  const { session } = await getAuthUser();
  const coral = await verifyCoralOwnership(coralId, session.user.id);

  const url = `https://${BUCKET}.s3.${REGION}.amazonaws.com/${s3Key}`;
  await prisma.coralPhoto.create({ data: { coralId, s3Key, url } });
  revalidatePath(`/tanks/${coral.tankId}/corals/${coralId}`);
}

export async function addCoralEvent(
  coralId: string,
  input: {
    eventType: CoralEventType;
    date: string;
    source?: string;
    notes?: string;
    price?: number;
  }
) {
  const { session } = await getAuthUser();
  const coral = await verifyCoralOwnership(coralId, session.user.id);

  await prisma.coralOwnershipEvent.create({
    data: {
      coralId,
      eventType: input.eventType,
      date: new Date(input.date),
      source: input.source || null,
      notes: input.notes || null,
      price: input.price ?? null,
    },
  });

  revalidatePath(`/tanks/${coral.tankId}/corals/${coralId}`);
}

export async function deleteCoralEvent(eventId: string) {
  const { session } = await getAuthUser();

  const event = await prisma.coralOwnershipEvent.findUnique({
    where: { id: eventId },
    select: {
      coral: {
        select: {
          tankId: true,
          id: true,
          tank: { select: { user: { select: { neonAuthId: true } } } },
        },
      },
    },
  });

  if (!event || event.coral.tank.user.neonAuthId !== session.user.id) {
    throw new Error("Event not found");
  }

  await prisma.coralOwnershipEvent.delete({ where: { id: eventId } });
  revalidatePath(`/tanks/${event.coral.tankId}/corals/${event.coral.id}`);
}

export async function deleteCoralPhoto(photoId: string, coralId: string) {
  const { session } = await getAuthUser();

  const photo = await prisma.coralPhoto.findUnique({
    where: { id: photoId },
    select: {
      s3Key: true,
      coral: {
        select: {
          tankId: true,
          tank: { select: { user: { select: { neonAuthId: true } } } },
        },
      },
    },
  });
  if (!photo || photo.coral.tank.user.neonAuthId !== session.user.id) {
    throw new Error("Photo not found");
  }

  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: photo.s3Key }));
  await prisma.coralPhoto.delete({ where: { id: photoId } });
  revalidatePath(`/tanks/${photo.coral.tankId}/corals/${coralId}`);
}
