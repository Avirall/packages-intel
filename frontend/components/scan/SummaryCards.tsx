"use client"

import { Package, AlertTriangle, ShieldAlert, Users } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { useScan } from "@/hooks/useScan"

const CARDS = [
  {
    key: "total",
    label: "Total packages",
    icon: Package,
    iconBg: "bg-teal-50",
    iconColor: "text-teal-600",
    accent: "border-l-teal-400",
    valueKey: (s: { total_packages: number; high_risk: number; medium_risk: number; avg_bus_factor: number }) => s.total_packages,
  },
  {
    key: "high",
    label: "High risk",
    icon: AlertTriangle,
    iconBg: "bg-red-50",
    iconColor: "text-red-600",
    accent: "border-l-red-400",
    valueKey: (s: { total_packages: number; high_risk: number; medium_risk: number; avg_bus_factor: number }) => s.high_risk,
  },
  {
    key: "medium",
    label: "Medium risk",
    icon: ShieldAlert,
    iconBg: "bg-amber-50",
    iconColor: "text-amber-600",
    accent: "border-l-amber-400",
    valueKey: (s: { total_packages: number; high_risk: number; medium_risk: number; avg_bus_factor: number }) => s.medium_risk,
  },
  {
    key: "bus",
    label: "Avg bus factor",
    icon: Users,
    iconBg: "bg-green-50",
    iconColor: "text-green-700",
    accent: "border-l-green-400",
    valueKey: (s: { total_packages: number; high_risk: number; medium_risk: number; avg_bus_factor: number }) => s.avg_bus_factor.toFixed(1),
  },
]

export function SummaryCards({ scanId }: { scanId: string }) {
  const { scan, loading } = useScan(scanId)

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}
      </div>
    )
  }
  if (!scan) return null

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {CARDS.map(({ key, label, icon: Icon, iconBg, iconColor, accent, valueKey }) => (
        <div
          key={key}
          className={`rounded-2xl border border-gray-100 bg-white p-5 shadow-sm border-l-4 ${accent}`}
        >
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
            <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}>
              <Icon className={`h-4 w-4 ${iconColor}`} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 tabular-nums">{valueKey(scan.summary)}</p>
        </div>
      ))}
    </div>
  )
}
