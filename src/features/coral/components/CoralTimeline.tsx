"use client";

import { useState } from "react";
import { useForm } from "@mantine/form";
import {
  Timeline,
  Text,
  Group,
  Badge,
  Button,
  Stack,
  Modal,
  Select,
  TextInput,
  Textarea,
  NumberInput,
  ActionIcon,
  Paper,
} from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { CoralEventType } from "@/generated/prisma";
import { addCoralEvent, deleteCoralEvent } from "@/features/coral/actions";

interface TimelineEvent {
  id: string;
  eventType: CoralEventType;
  date: Date;
  source: string | null;
  notes: string | null;
  price: number | null;
}

const EVENT_OPTIONS = [
  { value: "ACQUIRED", label: "Acquired" },
  { value: "FRAGGED", label: "Fragged" },
  { value: "SOLD", label: "Sold" },
  { value: "TRADED", label: "Traded" },
  { value: "GIFTED", label: "Gifted" },
  { value: "OBSERVATION", label: "Observation" },
];

const EVENT_COLORS: Record<CoralEventType, string> = {
  ACQUIRED: "teal",
  FRAGGED: "cyan",
  SOLD: "orange",
  TRADED: "grape",
  GIFTED: "pink",
  OBSERVATION: "gray",
};

function formatEventLabel(type: CoralEventType): string {
  return EVENT_OPTIONS.find((o) => o.value === type)?.label ?? type;
}

interface CoralTimelineProps {
  coralId: string;
  events: TimelineEvent[];
  isOwner: boolean;
}

export function CoralTimeline({ coralId, events, isOwner }: CoralTimelineProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const form = useForm({
    initialValues: {
      eventType: "" as CoralEventType,
      date: null as Date | null,
      source: "",
      notes: "",
      price: "" as unknown as number,
    },
    validate: {
      eventType: (v) => (!v ? "Event type is required" : null),
      date: (v) => (!v ? "Date is required" : null),
    },
  });

  async function handleSubmit(values: typeof form.values) {
    setSubmitting(true);
    setError(null);
    try {
      await addCoralEvent(coralId, {
        eventType: values.eventType,
        date: String(values.date!).split("T")[0],
        source: values.source.trim() || undefined,
        notes: values.notes.trim() || undefined,
        price: values.price ? Number(values.price) : undefined,
      });
      form.reset();
      setModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(eventId: string) {
    setDeletingId(eventId);
    try {
      await deleteCoralEvent(eventId);
    } catch {
      // ignore
    } finally {
      setDeletingId(null);
    }
  }

  const sorted = [...events].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <Paper withBorder p="lg">
      <Group justify="space-between" align="center" mb="md">
        <Text fw={600} size="lg">Ownership Timeline</Text>
        {isOwner && (
          <Button size="sm" variant="light" onClick={() => setModalOpen(true)}>
            Add Event
          </Button>
        )}
      </Group>

      {sorted.length === 0 ? (
        <Stack align="center" gap="xs" py="md">
          <Text c="dimmed" size="sm">No events recorded yet.</Text>
          {isOwner && (
            <Text c="dimmed" size="xs">Track where this coral came from, frags made, and observations.</Text>
          )}
        </Stack>
      ) : (
        <Timeline bulletSize={16} lineWidth={2}>
          {sorted.map((event) => (
            <Timeline.Item
              key={event.id}
              bullet={<div style={{ width: 8, height: 8, borderRadius: "50%", background: "currentColor" }} />}
              color={EVENT_COLORS[event.eventType]}
            >
              <Group justify="space-between" align="flex-start" gap="xs">
                <Stack gap={2}>
                  <Group gap="xs" align="center">
                    <Badge size="sm" color={EVENT_COLORS[event.eventType]} variant="light">
                      {formatEventLabel(event.eventType)}
                    </Badge>
                    <Text size="xs" c="dimmed">
                      {new Date(event.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </Text>
                    {event.price != null && (
                      <Text size="xs" c="dimmed">${event.price.toFixed(2)}</Text>
                    )}
                  </Group>
                  {event.source && (
                    <Text size="sm" fw={500}>{event.source}</Text>
                  )}
                  {event.notes && (
                    <Text size="sm" c="dimmed">{event.notes}</Text>
                  )}
                </Stack>
                {isOwner && (
                  <ActionIcon
                    size="xs"
                    variant="subtle"
                    color="red"
                    loading={deletingId === event.id}
                    onClick={() => handleDelete(event.id)}
                    aria-label="Delete event"
                  >
                    ×
                  </ActionIcon>
                )}
              </Group>
            </Timeline.Item>
          ))}
        </Timeline>
      )}

      <Modal
        opened={modalOpen}
        onClose={() => { setModalOpen(false); form.reset(); setError(null); }}
        title="Add Timeline Event"
        centered
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="sm">
            {error && <Text c="red" size="sm">{error}</Text>}

            <Select
              label="Event Type"
              placeholder="Select type"
              data={EVENT_OPTIONS}
              required
              {...form.getInputProps("eventType")}
            />

            <DateInput
              label="Date"
              placeholder="Pick a date"
              required
              valueFormat="MMMM D, YYYY"
              {...form.getInputProps("date")}
            />

            <TextInput
              label="Source / Origin"
              placeholder="e.g. Blue Ocean Corals, @username, Frag Swap 2025"
              {...form.getInputProps("source")}
            />

            <NumberInput
              label="Price"
              placeholder="e.g. 45.00"
              min={0}
              decimalScale={2}
              prefix="$"
              {...form.getInputProps("price")}
            />

            <Textarea
              label="Notes"
              placeholder="Any notes about this event..."
              rows={3}
              {...form.getInputProps("notes")}
            />

            <Group justify="flex-end" mt="xs">
              <Button variant="subtle" onClick={() => { setModalOpen(false); form.reset(); }} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" loading={submitting}>
                Add Event
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </Paper>
  );
}
