"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

interface ParameterRow {
  id: string;
  loggedAt: Date;
  ph: number | null;
  alkalinity: number | null;
  calcium: number | null;
  magnesium: number | null;
  nitrate: number | null;
  phosphate: number | null;
}

interface WaterParameterChartProps {
  parameters: ParameterRow[];
}

function fmt(date: Date) {
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function WaterParameterChart({ parameters }: WaterParameterChartProps) {
  // Oldest-first for chart
  const data = [...parameters].reverse().map((p) => ({
    date: fmt(p.loggedAt),
    pH: p.ph,
    Alk: p.alkalinity,
    Ca: p.calcium,
    Mg: p.magnesium,
    NO3: p.nitrate,
    PO4: p.phosphate,
  }));

  const hasMain = data.some((d) => d.pH != null || d.Alk != null || d.Ca != null || d.Mg != null);
  const hasNutrients = data.some((d) => d.NO3 != null || d.PO4 != null);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {hasMain && (
        <div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {data.some((d) => d.pH != null) && (
                <Line type="monotone" dataKey="pH" stroke="#339af0" dot={false} strokeWidth={2} connectNulls />
              )}
              {data.some((d) => d.Alk != null) && (
                <Line type="monotone" dataKey="Alk" stroke="#22b8cf" dot={false} strokeWidth={2} connectNulls />
              )}
              {data.some((d) => d.Ca != null) && (
                <Line type="monotone" dataKey="Ca" stroke="#20c997" dot={false} strokeWidth={2} connectNulls />
              )}
              {data.some((d) => d.Mg != null) && (
                <Line type="monotone" dataKey="Mg" stroke="#51cf66" dot={false} strokeWidth={2} connectNulls />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
      {hasNutrients && (
        <div>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {data.some((d) => d.NO3 != null) && (
                <Line type="monotone" dataKey="NO3" stroke="#fab005" dot={false} strokeWidth={2} connectNulls />
              )}
              {data.some((d) => d.PO4 != null) && (
                <Line type="monotone" dataKey="PO4" stroke="#fd7e14" dot={false} strokeWidth={2} connectNulls />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
