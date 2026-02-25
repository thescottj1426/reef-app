"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getAuthUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { s3 } from "@/lib/s3";
import type { CoralPlacement, LightingLevel, FlowLevel } from "@/generated/prisma";

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
