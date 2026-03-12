"use server";

import { revalidatePath } from "next/cache";
import { getAuthUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import type { TargetType } from "@/generated/prisma";

// Find the owner userId for a like/comment target
async function getTargetOwnerId(targetType: TargetType, targetId: string): Promise<string | null> {
  if (targetType === "TANK") {
    const tank = await prisma.tank.findUnique({ where: { id: targetId }, select: { userId: true } });
    return tank?.userId ?? null;
  }
  if (targetType === "CORAL") {
    const coral = await prisma.coral.findUnique({
      where: { id: targetId },
      select: { tank: { select: { userId: true } } },
    });
    return coral?.tank.userId ?? null;
  }
  return null;
}

export async function toggleLike(targetType: TargetType, targetId: string, revalidate: string) {
  const { user } = await getAuthUser();

  const existing = await prisma.like.findUnique({
    where: { userId_targetType_targetId: { userId: user.id, targetType, targetId } },
  });

  if (existing) {
    await prisma.like.delete({ where: { id: existing.id } });
  } else {
    await prisma.like.create({ data: { userId: user.id, targetType, targetId } });

    // Notify the owner (skip self-likes)
    const ownerId = await getTargetOwnerId(targetType, targetId);
    if (ownerId && ownerId !== user.id) {
      await prisma.notification.create({
        data: {
          userId: ownerId,
          type: "LIKE",
          fromUserId: user.id,
          targetType,
          targetId,
        },
      });
    }
  }

  revalidatePath(revalidate);
}

export async function addComment(
  targetType: TargetType,
  targetId: string,
  body: string,
  revalidate: string
) {
  const { user } = await getAuthUser();

  const trimmed = body.trim();
  if (!trimmed || trimmed.length > 500) {
    throw new Error("Comment must be 1–500 characters");
  }

  await prisma.comment.create({
    data: { userId: user.id, targetType, targetId, body: trimmed },
  });

  // Notify the owner (skip self-comments)
  const ownerId = await getTargetOwnerId(targetType, targetId);
  if (ownerId && ownerId !== user.id) {
    await prisma.notification.create({
      data: {
        userId: ownerId,
        type: "COMMENT",
        fromUserId: user.id,
        targetType,
        targetId,
      },
    });
  }

  revalidatePath(revalidate);
}

export async function deleteComment(commentId: string, revalidate: string) {
  const { user } = await getAuthUser();

  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment || comment.userId !== user.id) {
    throw new Error("Not found");
  }

  await prisma.comment.delete({ where: { id: commentId } });
  revalidatePath(revalidate);
}

export async function followUser(targetUserId: string, revalidate: string) {
  const { user } = await getAuthUser();
  if (user.id === targetUserId) return;

  await prisma.follow.upsert({
    where: { followerId_followingId: { followerId: user.id, followingId: targetUserId } },
    create: { followerId: user.id, followingId: targetUserId },
    update: {},
  });

  await prisma.notification.create({
    data: {
      userId: targetUserId,
      type: "FOLLOW",
      fromUserId: user.id,
    },
  });

  revalidatePath(revalidate);
}

export async function unfollowUser(targetUserId: string, revalidate: string) {
  const { user } = await getAuthUser();

  await prisma.follow.deleteMany({
    where: { followerId: user.id, followingId: targetUserId },
  });

  revalidatePath(revalidate);
}
