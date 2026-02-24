"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { auth0 } from "@/lib/auth0";
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
  const session = await auth0.getSession();
  if (!session) redirect("/login");

  const dbUser = await prisma.user.findUnique({
    where: { auth0Id: session.user.sub },
    select: { id: true },
  });
  if (!dbUser) throw new Error("User record not found");

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
      userId: dbUser.id,
    },
  });

  redirect("/");
}

async function verifyTankOwnership(tankId: string, auth0Id: string) {
  const tank = await prisma.tank.findUnique({
    where: { id: tankId },
    select: { userId: true, user: { select: { auth0Id: true } } },
  });
  if (!tank || tank.user.auth0Id !== auth0Id) {
    throw new Error("Tank not found");
  }
  return tank;
}

export async function getPresignedUploadUrl(
  tankId: string,
  filename: string,
  contentType: string
) {
  const session = await auth0.getSession();
  if (!session) redirect("/login");
  await verifyTankOwnership(tankId, session.user.sub);

  const s3Key = `tanks/${tankId}/${randomUUID()}-${filename}`;
  const presignedUrl = await getSignedUrl(
    s3,
    new PutObjectCommand({ Bucket: BUCKET, Key: s3Key, ContentType: contentType }),
    { expiresIn: 60 }
  );

  return { presignedUrl, s3Key };
}

export async function saveTankPhoto(tankId: string, s3Key: string) {
  const session = await auth0.getSession();
  if (!session) redirect("/login");
  await verifyTankOwnership(tankId, session.user.sub);

  const url = `https://${BUCKET}.s3.${REGION}.amazonaws.com/${s3Key}`;
  await prisma.tankPhoto.create({ data: { tankId, s3Key, url } });
  revalidatePath(`/tanks/${tankId}`);
}

export async function deleteTankPhoto(photoId: string, tankId: string) {
  const session = await auth0.getSession();
  if (!session) redirect("/login");

  const photo = await prisma.tankPhoto.findUnique({
    where: { id: photoId },
    select: { s3Key: true, tank: { select: { user: { select: { auth0Id: true } } } } },
  });
  if (!photo || photo.tank.user.auth0Id !== session.user.sub) {
    throw new Error("Photo not found");
  }

  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: photo.s3Key }));
  await prisma.tankPhoto.delete({ where: { id: photoId } });
  revalidatePath(`/tanks/${tankId}`);
}
