import { Center, Loader, Stack, Text } from "@mantine/core";

export default function Loading() {
  return (
    <Center mih="60vh">
      <Stack align="center" gap="sm">
        <Loader size="sm" />
        <Text size="sm" c="dimmed">
          Loading reef data...
        </Text>
      </Stack>
    </Center>
  );
}
