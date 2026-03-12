"use client";

import { useState } from "react";
import { Button } from "@mantine/core";
import { followUser, unfollowUser } from "@/features/social/actions";

interface FollowButtonProps {
  targetUserId: string;
  initialFollowing: boolean;
  revalidate: string;
}

export function FollowButton({ targetUserId, initialFollowing, revalidate }: FollowButtonProps) {
  const [following, setFollowing] = useState(initialFollowing);
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      if (following) {
        await unfollowUser(targetUserId, revalidate);
        setFollowing(false);
      } else {
        await followUser(targetUserId, revalidate);
        setFollowing(true);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      size="sm"
      variant={following ? "light" : "filled"}
      color="teal"
      loading={loading}
      onClick={handleClick}
    >
      {following ? "Following" : "Follow"}
    </Button>
  );
}
