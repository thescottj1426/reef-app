"use client";

import { useState } from "react";
import { useForm } from "@mantine/form";
import {
  TextInput,
  NumberInput,
  Select,
  Textarea,
  Button,
  Stack,
  Group,
  Text,
} from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { TankType } from "@/generated/prisma";
import { createTank } from "@/features/tanks/actions";

const TANK_TYPE_OPTIONS = [
  { value: "FOWLR", label: "FOWLR (Fish Only with Live Rock)" },
  { value: "REEF", label: "Reef" },
  { value: "NANO", label: "Nano" },
  { value: "PREDATOR", label: "Predator" },
];

export function TankForm() {
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm({
    initialValues: {
      name: "",
      volumeGal: "" as unknown as number,
      type: "" as TankType,
      setupDate: null as Date | null,
      description: "",
    },
    validate: {
      name: (v) => (v.trim().length === 0 ? "Tank name is required" : null),
      volumeGal: (v) => (!v || v <= 0 ? "Volume must be a positive number" : null),
      type: (v) => (!v ? "Tank type is required" : null),
    },
  });

  async function handleSubmit(values: typeof form.values) {
    setSubmitting(true);
    setServerError(null);
    try {
      await createTank({
        name: values.name,
        volumeGal: values.volumeGal,
        type: values.type,
        setupDate: values.setupDate,
        description: values.description,
      });
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
      setServerError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack>
        {serverError && (
          <Text c="red" size="sm">
            {serverError}
          </Text>
        )}

        <TextInput
          label="Tank Name"
          placeholder="e.g. Living Room Reef"
          required
          {...form.getInputProps("name")}
        />

        <NumberInput
          label="Volume (gallons)"
          placeholder="e.g. 75"
          required
          min={1}
          decimalScale={1}
          {...form.getInputProps("volumeGal")}
        />

        <Select
          label="Tank Type"
          placeholder="Select a type"
          data={TANK_TYPE_OPTIONS}
          required
          {...form.getInputProps("type")}
        />

        <DateInput
          label="Setup Date"
          placeholder="Pick a date (optional)"
          clearable
          valueFormat="MMMM D, YYYY"
          {...form.getInputProps("setupDate")}
        />

        <Textarea
          label="Description"
          placeholder="Tell us about your tank (optional)"
          autosize
          minRows={3}
          {...form.getInputProps("description")}
        />

        <Group justify="flex-end" mt="md">
          <Button component="a" href="/" variant="subtle" disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" loading={submitting}>
            Create Tank
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
