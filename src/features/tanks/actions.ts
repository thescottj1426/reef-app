"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getAuthUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { s3 } from "@/lib/s3";
import { TankType } from "@/generated/prisma";

const BUCKET = process.env.AWS_S3_BUCKET!;
const REGION = process.env.AWS_REGION!;

type CreateTankInput = {
  name: string;
  volumeGal: number;
  type: TankType;
  setupDate: Date | string | null;
  description: string;
};

export async function createTank(input: CreateTankInput) {
  const { user } = await getAuthUser();

  const name = input.name.trim();
  if (!name) throw new Error("Name is required");
  if (!input.volumeGal || input.volumeGal <= 0) throw new Error("Volume must be positive");
  if (!Object.values(TankType).includes(input.type)) throw new Error("Invalid tank type");

  await prisma.tank.create({
    data: {
      name,
      volumeGal: input.volumeGal,
      type: input.type,
      setupDate: input.setupDate ? new Date(input.setupDate) : null,
      description: input.description.trim() || null,
      userId: user.id,
    },
  });

  redirect("/");
}

export async function updateTank(tankId: string, input: CreateTankInput) {
  const { session } = await getAuthUser();
  await verifyTankOwnership(tankId, session.user.id);

  const name = input.name.trim();
  if (!name) throw new Error("Name is required");
  if (!input.volumeGal || input.volumeGal <= 0) throw new Error("Volume must be positive");
  if (!Object.values(TankType).includes(input.type)) throw new Error("Invalid tank type");

  await prisma.tank.update({
    where: { id: tankId },
    data: {
      name,
      volumeGal: input.volumeGal,
      type: input.type,
      setupDate: input.setupDate ? new Date(input.setupDate) : null,
      description: input.description.trim() || null,
    },
  });

  redirect(`/tanks/${tankId}`);
}

export async function deleteTank(tankId: string) {
  const { session } = await getAuthUser();
  await verifyTankOwnership(tankId, session.user.id);

  await prisma.tank.delete({ where: { id: tankId } });
  redirect("/");
}

async function verifyTankOwnership(tankId: string, neonAuthId: string) {
  const tank = await prisma.tank.findUnique({
    where: { id: tankId },
    select: { userId: true, user: { select: { neonAuthId: true } } },
  });
  if (!tank || tank.user.neonAuthId !== neonAuthId) {
    throw new Error("Tank not found");
  }
  return tank;
}

export async function getPresignedUploadUrl(
  tankId: string,
  filename: string,
  contentType: string
) {
  const { session } = await getAuthUser();
  await verifyTankOwnership(tankId, session.user.id);

  const s3Key = `tanks/${tankId}/${randomUUID()}-${filename}`;
  const presignedUrl = await getSignedUrl(
    s3,
    new PutObjectCommand({ Bucket: BUCKET, Key: s3Key, ContentType: contentType }),
    { expiresIn: 60 }
  );

  return { presignedUrl, s3Key };
}

export async function saveTankPhoto(tankId: string, s3Key: string) {
  const { session } = await getAuthUser();
  await verifyTankOwnership(tankId, session.user.id);

  const url = `https://${BUCKET}.s3.${REGION}.amazonaws.com/${s3Key}`;
  await prisma.tankPhoto.create({ data: { tankId, s3Key, url } });
  revalidatePath(`/tanks/${tankId}`);
}

export async function addWaterParameter(
  tankId: string,
  input: {
    loggedAt: string;
    temperature?: number;
    salinity?: number;
    ph?: number;
    alkalinity?: number;
    calcium?: number;
    magnesium?: number;
    nitrate?: number;
    phosphate?: number;
    notes?: string;
  }
) {
  const { session } = await getAuthUser();
  await verifyTankOwnership(tankId, session.user.id);

  await prisma.waterParameter.create({
    data: {
      tankId,
      loggedAt: new Date(input.loggedAt),
      temperature: input.temperature ?? null,
      salinity: input.salinity ?? null,
      ph: input.ph ?? null,
      alkalinity: input.alkalinity ?? null,
      calcium: input.calcium ?? null,
      magnesium: input.magnesium ?? null,
      nitrate: input.nitrate ?? null,
      phosphate: input.phosphate ?? null,
      notes: input.notes?.trim() || null,
    },
  });

  revalidatePath(`/tanks/${tankId}`);
}

export async function deleteWaterParameter(paramId: string) {
  const { session } = await getAuthUser();

  const param = await prisma.waterParameter.findUnique({
    where: { id: paramId },
    select: { tankId: true, tank: { select: { user: { select: { neonAuthId: true } } } } },
  });
  if (!param || param.tank.user.neonAuthId !== session.user.id) {
    throw new Error("Not found");
  }

  await prisma.waterParameter.delete({ where: { id: paramId } });
  revalidatePath(`/tanks/${param.tankId}`);
}

export async function deleteTankPhoto(photoId: string, tankId: string) {
  const { session } = await getAuthUser();

  const photo = await prisma.tankPhoto.findUnique({
    where: { id: photoId },
    select: { s3Key: true, tank: { select: { user: { select: { neonAuthId: true } } } } },
  });
  if (!photo || photo.tank.user.neonAuthId !== session.user.id) {
    throw new Error("Photo not found");
  }

  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: photo.s3Key }));
  await prisma.tankPhoto.delete({ where: { id: photoId } });
  revalidatePath(`/tanks/${tankId}`);
}
