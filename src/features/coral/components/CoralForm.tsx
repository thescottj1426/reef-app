"use client";

import { useState } from "react";
import { useForm } from "@mantine/form";
import { TextInput, Textarea, Select, Button, Stack, Group, Text } from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { createCoral, updateCoral } from "@/features/coral/actions";

type FormValues = {
  name: string;
  species: string;
  category: string;
  placement: string;
  lighting: string;
  flow: string;
  acquiredDate: Date | string | null;
  notes: string;
};

const categoryOptions = [
  { value: "SPS", label: "SPS — Small Polyp Stony" },
  { value: "LPS", label: "LPS — Large Polyp Stony" },
  { value: "SOFTIE", label: "Softie" },
  { value: "ZOA", label: "Zoanthid / Palythoa" },
  { value: "ANEMONE", label: "Anemone" },
  { value: "OTHER", label: "Other" },
];

const placementOptions = [
  { value: "SANDBED", label: "Sand Bed" },
  { value: "LOW_ROCK", label: "Low Rock" },
  { value: "MID_ROCK", label: "Mid Rock" },
  { value: "HIGH_ROCK", label: "High Rock" },
  { value: "FRAG_RACK", label: "Frag Rack" },
];

const levelOptions = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
];

interface CoralFormProps {
  tankId: string;
  coralId?: string;
  initialValues?: FormValues;
}

export function CoralForm({ tankId, coralId, initialValues }: CoralFormProps) {
  const isEdit = !!coralId;
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<FormValues>({
    initialValues: initialValues ?? {
      name: "",
      species: "",
      category: "",
      placement: "",
      lighting: "",
      flow: "",
      acquiredDate: null,
      notes: "",
    },
    validate: {
      name: (v) => (v.trim() ? null : "Name is required"),
    },
  });

  async function handleSubmit(values: FormValues) {
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        name: values.name.trim(),
        species: values.species.trim() || undefined,
        category: (values.category || undefined) as Parameters<typeof createCoral>[1]["category"],
        placement: (values.placement || undefined) as Parameters<typeof createCoral>[1]["placement"],
        lighting: (values.lighting || undefined) as Parameters<typeof createCoral>[1]["lighting"],
        flow: (values.flow || undefined) as Parameters<typeof createCoral>[1]["flow"],
        acquiredDate: values.acquiredDate
          ? String(values.acquiredDate).split("T")[0]
          : undefined,
        notes: values.notes.trim() || undefined,
      };
      if (isEdit) {
        await updateCoral(coralId, payload);
      } else {
        await createCoral(tankId, payload);
      }
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
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack>
        {error && <Text c="red" size="sm">{error}</Text>}

        <TextInput
          label="Name"
          placeholder="e.g. Hammer Coral"
          required
          {...form.getInputProps("name")}
        />

        <TextInput
          label="Species"
          placeholder="e.g. Euphyllia ancora"
          {...form.getInputProps("species")}
        />

        <Select
          label="Category"
          placeholder="Coral type"
          data={categoryOptions}
          clearable
          {...form.getInputProps("category")}
        />

        <Select
          label="Placement"
          placeholder="Select placement"
          data={placementOptions}
          clearable
          {...form.getInputProps("placement")}
        />

        <Group grow>
          <Select
            label="Lighting"
            placeholder="Select level"
            data={levelOptions}
            clearable
            {...form.getInputProps("lighting")}
          />
          <Select
            label="Flow"
            placeholder="Select level"
            data={levelOptions}
            clearable
            {...form.getInputProps("flow")}
          />
        </Group>

        <DateInput
          label="Acquired Date"
          placeholder="Pick a date"
          clearable
          {...form.getInputProps("acquiredDate")}
        />

        <Textarea
          label="Notes"
          placeholder="Any notes about this coral..."
          rows={3}
          {...form.getInputProps("notes")}
        />

        <Group justify="flex-end">
          <Button component="a" href={`/tanks/${tankId}`} variant="subtle">
            Cancel
          </Button>
          <Button type="submit" loading={submitting}>
            {isEdit ? "Save Changes" : "Add Coral"}
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
