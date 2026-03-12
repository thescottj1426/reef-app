"use client";

import { useState } from "react";
import { useForm } from "@mantine/form";
import {
  Paper,
  Group,
  Text,
  Button,
  Stack,
  Modal,
  Select,
  TextInput,
  Textarea,
  ActionIcon,
  Badge,
  SimpleGrid,
} from "@mantine/core";
import { addEquipment, deleteEquipment } from "@/features/tanks/actions";
import type { EquipmentCategory } from "@/generated/prisma";

const CATEGORY_OPTIONS = [
  { value: "LIGHT", label: "Light" },
  { value: "SKIMMER", label: "Skimmer" },
  { value: "RETURN_PUMP", label: "Return Pump" },
  { value: "POWERHEAD", label: "Powerhead" },
  { value: "DOSER", label: "Doser" },
  { value: "HEATER", label: "Heater" },
  { value: "CHILLER", label: "Chiller" },
  { value: "ATO", label: "ATO" },
  { value: "CONTROLLER", label: "Controller" },
  { value: "REACTOR", label: "Reactor" },
  { value: "OTHER", label: "Other" },
];

const CATEGORY_COLORS: Record<EquipmentCategory, string> = {
  LIGHT: "yellow",
  SKIMMER: "blue",
  RETURN_PUMP: "cyan",
  POWERHEAD: "teal",
  DOSER: "grape",
  HEATER: "red",
  CHILLER: "indigo",
  ATO: "green",
  CONTROLLER: "orange",
  REACTOR: "violet",
  OTHER: "gray",
};

interface EquipmentRow {
  id: string;
  category: EquipmentCategory;
  brand: string | null;
  model: string | null;
  notes: string | null;
}

interface EquipmentListProps {
  tankId: string;
  equipment: EquipmentRow[];
  isOwner: boolean;
}

export function EquipmentList({ tankId, equipment, isOwner }: EquipmentListProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const form = useForm({
    initialValues: {
      category: "" as EquipmentCategory | "",
      brand: "",
      model: "",
      notes: "",
    },
    validate: {
      category: (v) => (!v ? "Category is required" : null),
    },
  });

  async function handleSubmit(values: typeof form.values) {
    if (!values.category) return;
    setSubmitting(true);
    setError(null);
    try {
      await addEquipment(tankId, {
        category: values.category as EquipmentCategory,
        brand: values.brand || undefined,
        model: values.model || undefined,
        notes: values.notes || undefined,
      });
      form.reset();
      setModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await deleteEquipment(id);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <Paper withBorder p="lg">
      <Group justify="space-between" align="center" mb="md">
        <Text fw={600} size="lg">Equipment</Text>
        {isOwner && (
          <Button size="sm" variant="light" onClick={() => setModalOpen(true)}>
            Add Equipment
          </Button>
        )}
      </Group>

      {equipment.length === 0 ? (
        <Text c="dimmed" size="sm">
          {isOwner ? "Track your tank equipment — lights, skimmers, pumps, and more." : "No equipment listed yet."}
        </Text>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
          {equipment.map((eq) => (
            <Group key={eq.id} justify="space-between" align="flex-start" p="sm" style={{ border: "1px solid var(--mantine-color-default-border)", borderRadius: 8 }}>
              <Stack gap={4}>
                <Group gap="xs">
                  <Badge size="sm" variant="light" color={CATEGORY_COLORS[eq.category]}>
                    {CATEGORY_OPTIONS.find((o) => o.value === eq.category)?.label ?? eq.category}
                  </Badge>
                </Group>
                {(eq.brand || eq.model) && (
                  <Text size="sm" fw={500}>{[eq.brand, eq.model].filter(Boolean).join(" ")}</Text>
                )}
                {eq.notes && <Text size="xs" c="dimmed">{eq.notes}</Text>}
              </Stack>
              {isOwner && (
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  color="red"
                  loading={deletingId === eq.id}
                  onClick={() => handleDelete(eq.id)}
                >
                  ×
                </ActionIcon>
              )}
            </Group>
          ))}
        </SimpleGrid>
      )}

      <Modal
        opened={modalOpen}
        onClose={() => { setModalOpen(false); form.reset(); setError(null); }}
        title="Add Equipment"
        centered
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="sm">
            {error && <Text c="red" size="sm">{error}</Text>}

            <Select
              label="Category"
              placeholder="Select type"
              data={CATEGORY_OPTIONS}
              required
              {...form.getInputProps("category")}
            />

            <Group grow>
              <TextInput
                label="Brand"
                placeholder="e.g. Radion"
                {...form.getInputProps("brand")}
              />
              <TextInput
                label="Model"
                placeholder="e.g. XR30 G6"
                {...form.getInputProps("model")}
              />
            </Group>

            <Textarea
              label="Notes"
              placeholder="Settings, wattage, etc."
              rows={2}
              {...form.getInputProps("notes")}
            />

            <Group justify="flex-end" mt="xs">
              <Button variant="subtle" onClick={() => { setModalOpen(false); form.reset(); }} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" loading={submitting}>
                Add
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </Paper>
  );
}
