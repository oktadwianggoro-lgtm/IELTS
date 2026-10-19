"use client";

import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { DailyPageViews } from "@/lib/analytics/stats";

const chartConfig = {
  count: { label: "Kunjungan halaman", color: "var(--chart-1)" },
} satisfies ChartConfig;

export function AnalyticsChart({ data }: { data: DailyPageViews[] }) {
  return (
    <ChartContainer config={chartConfig} className="h-[240px] w-full">
      <BarChart data={data}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="date" tickLine={false} axisLine={false} tickFormatter={(v: string) => v.slice(5)} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="count" fill="var(--color-count)" radius={4} minPointSize={3} />
      </BarChart>
    </ChartContainer>
  );
}
