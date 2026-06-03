"use client"

import { Bar, BarChart, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton"
import { useScan } from "@/hooks/useScan"

const config = { risk_score: { label: "Risk score", color: "var(--chart-1)" } }

export function RiskBarChart({ scanId }: { scanId: string }) {
  const { packages, loading } = useScan(scanId)

  if (loading) return <Skeleton className="h-64 w-full" />

  const top10 = [...packages]
    .sort((a, b) => b.risk_score - a.risk_score)
    .slice(0, 10)
    .map((p) => ({ name: p.name, risk_score: Math.round(p.risk_score) }))

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Top 10 riskiest packages</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="h-48 w-full">
          <BarChart data={top10} layout="vertical" margin={{ left: 8, right: 16 }}>
            <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11 }} />
            <Bar dataKey="risk_score" fill="var(--chart-1)" radius={[0, 4, 4, 0]} />
            <ChartTooltip content={<ChartTooltipContent />} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
