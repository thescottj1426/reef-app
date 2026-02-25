"use client";

import { useEffect } from "react";
import { Alert, Button, Center, Stack, Text, Title } from "@mantine/core";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Center mih="60vh" p="md">
      <Stack gap="md" maw={520}>
        <Title order={3}>Something went wrong</Title>
        <Text size="sm" c="dimmed">
          We couldn&apos;t load this page. Try again, and if it keeps happening, refresh the app.
        </Text>
        <Alert color="red" variant="light" title="Error">
          {error.message || "Unexpected error"}
        </Alert>
        <Button onClick={reset} w="fit-content">
          Try again
        </Button>
      </Stack>
    </Center>
  );
}
