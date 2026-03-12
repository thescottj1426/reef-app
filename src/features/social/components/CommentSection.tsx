"use client";

import { useState } from "react";
import {
  Stack,
  Group,
  Avatar,
  Text,
  Textarea,
  Button,
  ActionIcon,
  Paper,
} from "@mantine/core";
import { addComment, deleteComment } from "@/features/social/actions";
import type { TargetType } from "@/generated/prisma";

interface CommentUser {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
}

interface CommentItem {
  id: string;
  body: string;
  createdAt: Date;
  user: CommentUser;
}

interface CommentSectionProps {
  targetType: TargetType;
  targetId: string;
  initialComments: CommentItem[];
  currentUserId: string;
  revalidate: string;
}

function relativeDate(date: Date | string): string {
  const diff = Date.now() - new Date(date).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}yr ago`;
}

export function CommentSection({
  targetType,
  targetId,
  initialComments,
  currentUserId,
  revalidate,
}: CommentSectionProps) {
  const [comments, setComments] = useState<CommentItem[]>(initialComments);
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await addComment(targetType, targetId, body, revalidate);
      setBody("");
      // Optimistically add a placeholder — page will revalidate with real data
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to post comment");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(commentId: string) {
    setDeletingId(commentId);
    try {
      await deleteComment(commentId, revalidate);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch {
      // ignore
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <Stack gap="sm">
      {comments.length === 0 && (
        <Text size="sm" c="dimmed">No comments yet. Be the first!</Text>
      )}
      {comments.map((comment) => (
        <Paper key={comment.id} withBorder p="sm" radius="md">
          <Group justify="space-between" align="flex-start" gap="xs">
            <Group gap="xs" align="flex-start" style={{ flex: 1 }}>
              <Avatar
                src={comment.user.avatarUrl}
                size={28}
                radius="xl"
                component="a"
                href={`/users/${comment.user.username}`}
              >
                {(comment.user.displayName || comment.user.username)
                  .slice(0, 1)
                  .toUpperCase()}
              </Avatar>
              <Stack gap={2} style={{ flex: 1 }}>
                <Group gap={6}>
                  <Text
                    size="xs"
                    fw={600}
                    component="a"
                    href={`/users/${comment.user.username}`}
                    style={{ textDecoration: "none" }}
                    c="inherit"
                  >
                    {comment.user.displayName || `@${comment.user.username}`}
                  </Text>
                  <Text size="xs" c="dimmed">{relativeDate(comment.createdAt)}</Text>
                </Group>
                <Text size="sm">{comment.body}</Text>
              </Stack>
            </Group>
            {comment.user.id === currentUserId && (
              <ActionIcon
                size="xs"
                variant="subtle"
                color="red"
                loading={deletingId === comment.id}
                onClick={() => handleDelete(comment.id)}
                aria-label="Delete comment"
              >
                ×
              </ActionIcon>
            )}
          </Group>
        </Paper>
      ))}

      <form onSubmit={handleSubmit}>
        <Stack gap="xs">
          {error && <Text size="xs" c="red">{error}</Text>}
          <Textarea
            placeholder="Add a comment..."
            value={body}
            onChange={(e) => setBody(e.currentTarget.value)}
            rows={2}
            maxLength={500}
          />
          <Group justify="flex-end">
            <Button type="submit" size="xs" loading={submitting} disabled={!body.trim()}>
              Post
            </Button>
          </Group>
        </Stack>
      </form>
    </Stack>
  );
}
