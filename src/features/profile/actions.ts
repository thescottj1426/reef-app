"use server";

import { revalidatePath } from "next/cache";
import { getAuthUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

type UpdateProfileInput = {
  username: string;
  displayName: string;
  location: string;
  avatarUrl: string;
  bio: string;
};

function validateUsername(username: string) {
  const normalized = username.trim().toLowerCase();
  if (!/^[a-z0-9_]{3,24}$/.test(normalized)) {
    throw new Error("Username must be 3-24 chars using letters, numbers, or underscores");
  }
  return normalized;
}

function validateOptionalUrl(value: string) {
  const normalized = value.trim();
  if (!normalized) return null;
  try {
    const parsed = new URL(normalized);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      throw new Error("Avatar URL must use http or https");
    }
    return parsed.toString();
  } catch {
    throw new Error("Avatar URL must be a valid URL");
  }
}

export async function updateMyProfile(input: UpdateProfileInput) {
  const { user } = await getAuthUser();

  const username = validateUsername(input.username);
  const displayName = input.displayName.trim() || null;
  const location = input.location.trim() || null;
  const bio = input.bio.trim() || null;
  const avatarUrl = validateOptionalUrl(input.avatarUrl);

  if (displayName && displayName.length > 60) {
    throw new Error("Display name must be 60 characters or less");
  }
  if (location && location.length > 80) {
    throw new Error("Location must be 80 characters or less");
  }
  if (bio && bio.length > 280) {
    throw new Error("Bio must be 280 characters or less");
  }

  try {
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { username, displayName, location, avatarUrl, bio },
      select: { username: true },
    });

    revalidatePath("/");
    revalidatePath("/users");
    revalidatePath(`/users/${user.username}`);
    revalidatePath(`/users/${updated.username}`);
    revalidatePath("/settings/profile");

    return { ok: true as const, username: updated.username };
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: string }).code === "P2002"
    ) {
      throw new Error("That username is already taken");
    }
    throw error;
  }
}
