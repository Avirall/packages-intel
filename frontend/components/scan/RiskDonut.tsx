"use client"

import { Pie, PieChart } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton"
import { useScan } from "@/hooks/useScan"

const config = {
  high:   { label: "High",   color: "var(--chart-1)" },
  medium: { label: "Medium", color: "var(--chart-2)" },
  low:    { label: "Low",    color: "var(--chart-3)" },
}

export function RiskDonut({ scanId }: { scanId: string }) {
  const { scan, loading } = useScan(scanId)

  if (loading) return <Skeleton className="h-64 w-full" />
  if (!scan) return null

  const data = [
    { name: "high",   value: scan.summary.high_risk,   fill: "var(--chart-1)" },
    { name: "medium", value: scan.summary.medium_risk, fill: "var(--chart-2)" },
    { name: "low",    value: scan.summary.low_risk,    fill: "var(--chart-3)" },
  ].filter((d) => d.value > 0)

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Risk distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="h-48 w-full">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={50} outerRadius={75} />
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
          </PieChart>
        </ChartContainer>
        <div className="flex justify-center gap-4 mt-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[var(--chart-1)]" /> HIGH {scan.summary.high_risk}</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[var(--chart-2)]" /> MED {scan.summary.medium_risk}</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[var(--chart-3)]" /> LOW {scan.summary.low_risk}</span>
        </div>
      </CardContent>
    </Card>
  )
}
