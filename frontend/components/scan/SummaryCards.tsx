"use client"

import { Package, AlertTriangle, ShieldCheck, Users } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useScan } from "@/hooks/useScan"

export function SummaryCards({ scanId }: { scanId: string }) {
  const { scan, loading } = useScan(scanId)

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
      </div>
    )
  }

  if (!scan) return null

  const cards = [
    { label: "Total packages",  value: scan.summary.total_packages, icon: Package,       color: "text-primary" },
    { label: "High risk",       value: scan.summary.high_risk,      icon: AlertTriangle,  color: "text-red-400" },
    { label: "Medium risk",     value: scan.summary.medium_risk,    icon: ShieldCheck,    color: "text-amber-400" },
    { label: "Avg bus factor",  value: scan.summary.avg_bus_factor.toFixed(1), icon: Users, color: "text-green-400" },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map(({ label, value, icon: Icon, color }) => (
        <Card key={label}>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-muted-foreground text-xs">{label}</p>
                <p className="text-2xl font-bold mt-1">{value}</p>
              </div>
              <Icon className={`h-5 w-5 ${color} opacity-80`} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
