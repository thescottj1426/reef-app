"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "@mantine/form";
import { Alert, Avatar, Button, Group, Stack, Text, TextInput, Textarea } from "@mantine/core";
import { updateMyProfile } from "@/features/profile/actions";

type ProfileFormProps = {
  initialValues: {
    username: string;
    displayName: string;
    location: string;
    avatarUrl: string;
    bio: string;
  };
};

export function ProfileForm({ initialValues }: ProfileFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const form = useForm({
    initialValues,
    validate: {
      username: (value) => {
        const normalized = value.trim().toLowerCase();
        if (!/^[a-z0-9_]{3,24}$/.test(normalized)) {
          return "Use 3-24 chars: letters, numbers, underscores";
        }
        return null;
      },
      displayName: (value) => (value.trim().length > 60 ? "Max 60 characters" : null),
      location: (value) => (value.trim().length > 80 ? "Max 80 characters" : null),
      bio: (value) => (value.trim().length > 280 ? "Max 280 characters" : null),
      avatarUrl: (value) => {
        const normalized = value.trim();
        if (!normalized) return null;
        try {
          const parsed = new URL(normalized);
          if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
            return "URL must use http or https";
          }
          return null;
        } catch {
          return "Enter a valid URL";
        }
      },
    },
  });

  async function handleSubmit(values: typeof form.values) {
    setSubmitting(true);
    setServerError(null);
    setSuccessMessage(null);

    try {
      const result = await updateMyProfile(values);
      setSuccessMessage("Profile updated");
      if (result.username !== initialValues.username) {
        router.push(`/users/${result.username}`);
        return;
      }
      router.refresh();
      setSubmitting(false);
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack gap="md">
        {serverError && (
          <Alert color="red" variant="light" title="Could not update profile">
            {serverError}
          </Alert>
        )}

        {successMessage && (
          <Alert color="teal" variant="light" title="Saved">
            {successMessage}
          </Alert>
        )}

        <Group align="center" gap="sm">
          <Avatar src={form.values.avatarUrl || null} radius="xl" size="lg">
            {(form.values.displayName || form.values.username || "U").slice(0, 1).toUpperCase()}
          </Avatar>
          <Text size="sm" c="dimmed">
            Public profile preview
          </Text>
        </Group>

        <TextInput
          label="Username"
          description="Used in your public profile URL"
          required
          {...form.getInputProps("username")}
        />

        <TextInput
          label="Display name"
          placeholder="How your name appears publicly"
          {...form.getInputProps("displayName")}
        />

        <TextInput
          label="Location"
          placeholder="City, State / Country"
          {...form.getInputProps("location")}
        />

        <TextInput
          label="Avatar URL"
          placeholder="https://..."
          {...form.getInputProps("avatarUrl")}
        />

        <Textarea
          label="Bio"
          placeholder="Tell other reef keepers about your setup"
          autosize
          minRows={4}
          {...form.getInputProps("bio")}
        />

        <Group justify="flex-end" mt="xs">
          <Button component="a" href="/" variant="subtle" disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" loading={submitting}>
            Save profile
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
