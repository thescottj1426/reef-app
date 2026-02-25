import { Button, Center, Stack, Text, Title } from "@mantine/core";

export default function NotFound() {
  return (
    <Center mih="60vh" p="md">
      <Stack gap="sm" align="center">
        <Title order={2}>Page not found</Title>
        <Text c="dimmed" size="sm" ta="center">
          This page doesn&apos;t exist or may have been moved.
        </Text>
        <Button component="a" href="/" variant="light">
          Go home
        </Button>
      </Stack>
    </Center>
  );
}
