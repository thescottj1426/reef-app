"use client";

import { useState } from "react";
import { Button, Modal, Text, Group, Stack } from "@mantine/core";
import { deleteTank } from "@/features/tanks/actions";

export function DeleteTankButton({ tankId, tankName }: { tankId: string; tankName: string }) {
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteTank(tankId);
    } catch (err) {
      if (
        err !== null &&
        typeof err === "object" &&
        "digest" in err &&
        typeof (err as { digest: unknown }).digest === "string" &&
        (err as { digest: string }).digest.startsWith("NEXT_REDIRECT")
      ) {
        throw err;
      }
      setDeleting(false);
      setOpen(false);
    }
  }

  return (
    <>
      <Button variant="subtle" color="red" size="sm" onClick={() => setOpen(true)}>
        Delete tank
      </Button>

      <Modal opened={open} onClose={() => setOpen(false)} title="Delete tank" centered>
        <Stack gap="md">
          <Text size="sm">
            Are you sure you want to delete <strong>{tankName}</strong>? This will permanently
            remove the tank, all its corals, and all photos. This cannot be undone.
          </Text>
          <Group justify="flex-end">
            <Button variant="subtle" onClick={() => setOpen(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button color="red" onClick={handleDelete} loading={deleting}>
              Delete
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
