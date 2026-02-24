import { Container, Paper, Title, Text, Button, Stack, Center } from "@mantine/core";

export default function LoginPage() {
  return (
    <Center style={{ minHeight: "100vh" }}>
      <Container size={420}>
        <Stack align="center" mb="xl">
          <Title order={1} ta="center">
            ReefBuilder
          </Title>
          <Text c="dimmed" size="sm" ta="center">
            Build your reef tank, track your corals, connect with the community.
          </Text>
        </Stack>

        <Paper withBorder shadow="md" p="xl" radius="md">
          <Stack>
            <Title order={3} ta="center">
              Welcome back
            </Title>
            <Text c="dimmed" size="sm" ta="center">
              Sign in to manage your reef tank
            </Text>
            <Button component="a" href="/auth/login?returnTo=/" fullWidth mt="sm">
              Sign in
            </Button>
          </Stack>
        </Paper>
      </Container>
    </Center>
  );
}
