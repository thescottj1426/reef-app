"use client";

import { useState } from "react";
import { Button } from "@mantine/core";
import { toggleLike } from "@/features/social/actions";
import type { TargetType } from "@/generated/prisma";

interface LikeButtonProps {
  targetType: TargetType;
  targetId: string;
  initialCount: number;
  initialLiked: boolean;
  revalidate: string;
}

export function LikeButton({
  targetType,
  targetId,
  initialCount,
  initialLiked,
  revalidate,
}: LikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    setLiked((v) => !v);
    setCount((v) => (liked ? v - 1 : v + 1));
    try {
      await toggleLike(targetType, targetId, revalidate);
    } catch {
      // revert on error
      setLiked((v) => !v);
      setCount((v) => (liked ? v + 1 : v - 1));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant={liked ? "light" : "subtle"}
      color={liked ? "pink" : "gray"}
      size="sm"
      loading={loading}
      onClick={handleClick}
      leftSection={liked ? "♥" : "♡"}
    >
      {count > 0 ? count : ""} {count === 1 ? "Like" : "Likes"}
    </Button>
  );
}
