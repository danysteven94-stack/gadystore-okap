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
    <div className="rounded-card border border-ink/10 dark:border-dark-border bg-white dark:bg-dark-surface p-4">
      <p className="text-sm font-medium mb-3">Vant ak pwofi — 7 dènye jou</p>
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#12332E" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#12332E" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="profitFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#C08829" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#C08829" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E1D8" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: "#6B7B76" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis tick={{ fontSize: 10, fill: "#6B7B76" }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E5E1D8" }}
            formatter={(value: number) => `${value.toLocaleString("fr-FR")} G`}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            name="Revni"
            stroke="#12332E"
            fill="url(#revenueFill)"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="profit"
            name="Pwofi"
            stroke="#C08829"
            fill="url(#profitFill)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
