"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

interface Props {
  data: { date: string; revenue: number; profit: number }[];
}

export function RevenueChart({ data }: Props) {
  return (
    <div className="rounded-card border border-line dark:border-dark-border bg-white dark:bg-dark-surface p-4">
      <p className="text-sm font-medium mb-3">Vant ak pwofi — 7 dènye jou</p>
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: "#6B6B6B" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis tick={{ fontSize: 10, fill: "#6B6B6B" }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E5E5E5" }}
            formatter={(value: number) => `${value.toLocaleString("fr-FR")} G`}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            name="Revni"
            stroke="#111111"
            fill="#111111" fillOpacity={0.06}
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="profit"
            name="Pwofi"
            stroke="#C8102E"
            fill="#C8102E" fillOpacity={0.08}
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
