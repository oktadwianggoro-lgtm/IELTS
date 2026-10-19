"use client";

import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const chartConfig = {
  accuracyPct: { label: "Akurasi (%)", color: "var(--chart-1)" },
} satisfies ChartConfig;

export function ProgressCharts({
  weeklyAccuracy,
}: {
  weeklyAccuracy: { week: string; accuracyPct: number; total: number }[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Tren Akurasi Mingguan</CardTitle>
      </CardHeader>
      <CardContent>
        {weeklyAccuracy.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Belum ada data — mulai berlatih untuk melihat tren akurasi Anda.
          </p>
        ) : (
          <ChartContainer config={chartConfig} className="h-[240px] w-full">
            <BarChart data={weeklyAccuracy}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="week"
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: string) => v.slice(5)}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar
                dataKey="accuracyPct"
                fill="var(--color-accuracyPct)"
                radius={4}
                minPointSize={3}
              />
            </BarChart>
          </ChartContainer>
        )}
        <p className="text-muted-foreground mt-2 text-xs">
          Estimasi akurasi mingguan dari soal latihan — bukan skor resmi IELTS.
        </p>
      </CardContent>
    </Card>
  );
}
