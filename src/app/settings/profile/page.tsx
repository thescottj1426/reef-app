import { AppNav } from "@/components/AppNav";
import { getAuthUser } from "@/lib/auth/session";
import { ProfileForm } from "@/features/profile/components/ProfileForm";
import { Container, Paper, Stack, Text, Title } from "@mantine/core";

export default async function ProfileSettingsPage() {
  const { user } = await getAuthUser();

  return (
    <>
      <AppNav />
      <Container size="sm" py="xl">
        <Stack gap="lg">
          <Paper withBorder p="lg">
            <Title order={3}>Edit Profile</Title>
            <Text c="dimmed" size="sm" mt={4}>
              Update how your profile appears across the app.
            </Text>
          </Paper>

          <Paper withBorder p="lg">
            <ProfileForm
              initialValues={{
                username: user.username,
                displayName: user.displayName ?? "",
                location: user.location ?? "",
                avatarUrl: user.avatarUrl ?? "",
                bio: user.bio ?? "",
              }}
            />
          </Paper>
        </Stack>
      </Container>
    </>
  );
}
