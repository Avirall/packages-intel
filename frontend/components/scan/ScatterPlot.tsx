"use client"

import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { Skeleton } from "@/components/ui/skeleton"
import { useScan } from "@/hooks/useScan"
import type { PackageRisk } from "@/types/scan"

const RISK_COLORS: Record<string, string> = {
  HIGH:   "#ef4444",
  MEDIUM: "#f59e0b",
  LOW:    "#14b8a6",
}

interface TooltipProps { active?: boolean; payload?: Array<{ payload: PackageRisk }> }

function CustomTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload?.length) return null
  const pkg = payload[0].payload
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-xs shadow-lg">
      <p className="font-mono font-semibold text-gray-900 mb-1.5">{pkg.name}</p>
      <div className="space-y-0.5 text-gray-500">
        <p>Bus factor: <span className="text-gray-900 font-medium">{pkg.bus_factor}</span></p>
        <p>Risk score: <span className="text-gray-900 font-medium">{Math.round(pkg.risk_score)}</span></p>
        <p>Downloads/wk: <span className="text-gray-900 font-medium">{pkg.weekly_downloads.toLocaleString()}</span></p>
      </div>
    </div>
  )
}

export function ScatterPlot({ scanId }: { scanId: string }) {
  const { packages, loading } = useScan(scanId)

  if (loading) return <Skeleton className="h-72 w-full rounded-2xl" />
  if (!packages.length) return null

  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="px-5 pt-5 pb-0">
        <p className="text-sm font-semibold text-gray-900">Bus factor vs Risk score</p>
        <p className="text-xs text-gray-500 mt-0.5">Bottom-right = high risk with low contributor coverage · Bubble size = weekly downloads</p>
      </div>
      <div className="px-5 pb-5 pt-4">
        <ResponsiveContainer width="100%" height={260}>
          <ScatterChart margin={{ top: 8, right: 16, bottom: 16, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
            <XAxis
              dataKey="bus_factor"
              name="Bus factor"
              type="number"
              label={{ value: "Bus factor", position: "insideBottom", offset: -8, fontSize: 11, fill: "#9ca3af" }}
              tick={{ fontSize: 11, fill: "#6b7280" }}
              domain={[0, "dataMax + 1"]}
              axisLine={{ stroke: "#e5e7eb" }}
              tickLine={false}
            />
            <YAxis
              dataKey="risk_score"
              name="Risk score"
              type="number"
              domain={[0, 100]}
              tick={{ fontSize: 11, fill: "#6b7280" }}
              width={32}
              axisLine={{ stroke: "#e5e7eb" }}
              tickLine={false}
            />
            <ZAxis dataKey="weekly_downloads" range={[40, 400]} />
            <Tooltip content={<CustomTooltip />} />
            <Scatter data={packages}>
              {packages.map((pkg) => (
                <Cell key={pkg.name} fill={RISK_COLORS[pkg.risk_label] ?? "#6366f1"} fillOpacity={0.75} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
        <div className="flex justify-center gap-5 text-xs text-gray-500">
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-red-400" /> HIGH</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-amber-400" /> MEDIUM</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-teal-400" /> LOW</span>
        </div>
      </div>
    </div>
  )
}
