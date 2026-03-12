"use client";

import { useState } from "react";
import { useForm } from "@mantine/form";
import {
  Button,
  Modal,
  Stack,
  NumberInput,
  Textarea,
  Group,
  Text,
} from "@mantine/core";
import { createFragListing } from "@/features/frags/actions";

interface CreateFragListingButtonProps {
  coralId: string;
  coralName: string;
}

export function CreateFragListingButton({ coralId, coralName }: CreateFragListingButtonProps) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm({
    initialValues: {
      price: "" as unknown as number,
      qty: 1,
      notes: "",
    },
  });

  async function handleSubmit(values: typeof form.values) {
    setSubmitting(true);
    setError(null);
    try {
      await createFragListing(coralId, {
        price: values.price ? Number(values.price) : undefined,
        qty: values.qty || 1,
        notes: values.notes || undefined,
      });
      form.reset();
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Button variant="light" color="teal" size="sm" onClick={() => setOpen(true)}>
        List on Frag Board
      </Button>

      <Modal
        opened={open}
        onClose={() => { setOpen(false); form.reset(); setError(null); }}
        title={`List frag of "${coralName}"`}
        centered
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="sm">
            {error && <Text c="red" size="sm">{error}</Text>}

            <NumberInput
              label="Price (leave blank for free / trade)"
              placeholder="e.g. 25.00"
              min={0}
              decimalScale={2}
              prefix="$"
              {...form.getInputProps("price")}
            />

            <NumberInput
              label="Quantity available"
              min={1}
              {...form.getInputProps("qty")}
            />

            <Textarea
              label="Notes"
              placeholder="Frag size, care tips, pickup/shipping info..."
              rows={3}
              {...form.getInputProps("notes")}
            />

            <Group justify="flex-end" mt="xs">
              <Button variant="subtle" onClick={() => { setOpen(false); form.reset(); }} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" loading={submitting}>
                List Frag
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </>
  );
}
