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
  NumberInput,
  Textarea,
  ActionIcon,
  Table,
  Badge,
} from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { addWaterParameter, deleteWaterParameter } from "@/features/tanks/actions";
import { WaterParameterChart } from "./WaterParameterChart";

interface ParameterRow {
  id: string;
  loggedAt: Date;
  temperature: number | null;
  salinity: number | null;
  ph: number | null;
  alkalinity: number | null;
  calcium: number | null;
  magnesium: number | null;
  nitrate: number | null;
  phosphate: number | null;
  notes: string | null;
}

interface WaterParameterLogProps {
  tankId: string;
  parameters: ParameterRow[];
  isOwner: boolean;
}

function fmt(v: number | null, dec = 1): string {
  return v != null ? v.toFixed(dec) : "—";
}

export function WaterParameterLog({ tankId, parameters, isOwner }: WaterParameterLogProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const form = useForm({
    initialValues: {
      loggedAt: null as Date | null,
      temperature: "" as unknown as number,
      salinity: "" as unknown as number,
      ph: "" as unknown as number,
      alkalinity: "" as unknown as number,
      calcium: "" as unknown as number,
      magnesium: "" as unknown as number,
      nitrate: "" as unknown as number,
      phosphate: "" as unknown as number,
      notes: "",
    },
    validate: {
      loggedAt: (v) => (!v ? "Date is required" : null),
    },
  });

  async function handleSubmit(values: typeof form.values) {
    if (!values.loggedAt) return;
    setSubmitting(true);
    setError(null);
    try {
      await addWaterParameter(tankId, {
        loggedAt: String(values.loggedAt).split("T")[0],
        temperature: values.temperature ? Number(values.temperature) : undefined,
        salinity: values.salinity ? Number(values.salinity) : undefined,
        ph: values.ph ? Number(values.ph) : undefined,
        alkalinity: values.alkalinity ? Number(values.alkalinity) : undefined,
        calcium: values.calcium ? Number(values.calcium) : undefined,
        magnesium: values.magnesium ? Number(values.magnesium) : undefined,
        nitrate: values.nitrate ? Number(values.nitrate) : undefined,
        phosphate: values.phosphate ? Number(values.phosphate) : undefined,
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

  async function handleDelete(paramId: string) {
    setDeletingId(paramId);
    try {
      await deleteWaterParameter(paramId);
    } catch {
      // ignore
    } finally {
      setDeletingId(null);
    }
  }

  // Latest values for stat strip
  const latest = parameters[0];

  return (
    <Paper withBorder p="lg">
      <Group justify="space-between" align="center" mb="md">
        <Text fw={600} size="lg">Water Parameters</Text>
        {isOwner && (
          <Button size="sm" variant="light" onClick={() => setModalOpen(true)}>
            Log Parameters
          </Button>
        )}
      </Group>

      {/* Chart — shown when 2+ entries */}
      {parameters.length >= 2 && (
        <WaterParameterChart parameters={parameters} />
      )}

      {/* Latest values strip */}
      {latest && (
        <Group gap="xs" mb="md" wrap="wrap">
          {latest.ph != null && <Badge variant="light" color="blue">pH {fmt(latest.ph, 2)}</Badge>}
          {latest.alkalinity != null && <Badge variant="light" color="cyan">Alk {fmt(latest.alkalinity)}</Badge>}
          {latest.calcium != null && <Badge variant="light" color="teal">Ca {fmt(latest.calcium, 0)}</Badge>}
          {latest.magnesium != null && <Badge variant="light" color="green">Mg {fmt(latest.magnesium, 0)}</Badge>}
          {latest.nitrate != null && <Badge variant="light" color="yellow">NO₃ {fmt(latest.nitrate)}</Badge>}
          {latest.phosphate != null && <Badge variant="light" color="orange">PO₄ {fmt(latest.phosphate, 3)}</Badge>}
          {latest.temperature != null && <Badge variant="light" color="red">Temp {fmt(latest.temperature)}°F</Badge>}
          {latest.salinity != null && <Badge variant="light" color="grape">Sal {fmt(latest.salinity, 3)}</Badge>}
          <Text size="xs" c="dimmed" ml={4}>
            logged {new Date(latest.loggedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </Text>
        </Group>
      )}

      {parameters.length === 0 ? (
        <Stack align="center" gap="xs" py="md">
          <Text c="dimmed" size="sm">No parameters logged yet.</Text>
          {isOwner && (
            <Text c="dimmed" size="xs">Track pH, alkalinity, calcium, and more over time.</Text>
          )}
        </Stack>
      ) : (
        <Table striped highlightOnHover withTableBorder withColumnBorders style={{ fontSize: 12 }}>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Date</Table.Th>
              <Table.Th>Temp</Table.Th>
              <Table.Th>Sal</Table.Th>
              <Table.Th>pH</Table.Th>
              <Table.Th>Alk</Table.Th>
              <Table.Th>Ca</Table.Th>
              <Table.Th>Mg</Table.Th>
              <Table.Th>NO₃</Table.Th>
              <Table.Th>PO₄</Table.Th>
              {isOwner && <Table.Th />}
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {parameters.slice(0, 10).map((row) => (
              <Table.Tr key={row.id}>
                <Table.Td>
                  {new Date(row.loggedAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "2-digit",
                  })}
                </Table.Td>
                <Table.Td>{fmt(row.temperature)}°</Table.Td>
                <Table.Td>{fmt(row.salinity, 3)}</Table.Td>
                <Table.Td>{fmt(row.ph, 2)}</Table.Td>
                <Table.Td>{fmt(row.alkalinity)}</Table.Td>
                <Table.Td>{fmt(row.calcium, 0)}</Table.Td>
                <Table.Td>{fmt(row.magnesium, 0)}</Table.Td>
                <Table.Td>{fmt(row.nitrate)}</Table.Td>
                <Table.Td>{fmt(row.phosphate, 3)}</Table.Td>
                {isOwner && (
                  <Table.Td>
                    <ActionIcon
                      size="xs"
                      variant="subtle"
                      color="red"
                      loading={deletingId === row.id}
                      onClick={() => handleDelete(row.id)}
                      aria-label="Delete"
                    >
                      ×
                    </ActionIcon>
                  </Table.Td>
                )}
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}

      <Modal
        opened={modalOpen}
        onClose={() => { setModalOpen(false); form.reset(); setError(null); }}
        title="Log Water Parameters"
        centered
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="sm">
            {error && <Text c="red" size="sm">{error}</Text>}

            <DateInput
              label="Date"
              placeholder="Pick a date"
              required
              valueFormat="MMMM D, YYYY"
              {...form.getInputProps("loggedAt")}
            />

            <Group grow>
              <NumberInput label="Temp (°F)" placeholder="78.0" decimalScale={1} min={0} {...form.getInputProps("temperature")} />
              <NumberInput label="Salinity" placeholder="1.025" decimalScale={3} min={0} {...form.getInputProps("salinity")} />
            </Group>
            <Group grow>
              <NumberInput label="pH" placeholder="8.2" decimalScale={2} min={0} {...form.getInputProps("ph")} />
              <NumberInput label="Alkalinity (dKH)" placeholder="9.5" decimalScale={1} min={0} {...form.getInputProps("alkalinity")} />
            </Group>
            <Group grow>
              <NumberInput label="Calcium (ppm)" placeholder="440" decimalScale={0} min={0} {...form.getInputProps("calcium")} />
              <NumberInput label="Magnesium (ppm)" placeholder="1300" decimalScale={0} min={0} {...form.getInputProps("magnesium")} />
            </Group>
            <Group grow>
              <NumberInput label="Nitrate (ppm)" placeholder="5.0" decimalScale={1} min={0} {...form.getInputProps("nitrate")} />
              <NumberInput label="Phosphate (ppm)" placeholder="0.05" decimalScale={3} min={0} {...form.getInputProps("phosphate")} />
            </Group>

            <Textarea label="Notes" placeholder="Any notes..." rows={2} {...form.getInputProps("notes")} />

            <Group justify="flex-end" mt="xs">
              <Button variant="subtle" onClick={() => { setModalOpen(false); form.reset(); }} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" loading={submitting}>
                Save
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </Paper>
  );
}
