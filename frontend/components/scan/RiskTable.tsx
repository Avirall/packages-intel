"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { RiskBadge } from "@/components/shared/RiskBadge"
import { useScan } from "@/hooks/useScan"

export function RiskTable({ scanId }: { scanId: string }) {
  const { packages, loading } = useScan(scanId)

  if (loading) return <Skeleton className="h-64 w-full" />

  const sorted = [...packages].sort((a, b) => b.risk_score - a.risk_score)

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Package</TableHead>
            <TableHead>Risk</TableHead>
            <TableHead className="text-right">Bus factor</TableHead>
            <TableHead className="text-right">Downloads/wk</TableHead>
            <TableHead>Last commit</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((pkg) => (
            <TableRow key={pkg.name}>
              <TableCell className="font-mono text-sm font-medium">{pkg.name}</TableCell>
              <TableCell><RiskBadge label={pkg.risk_label} /></TableCell>
              <TableCell className="text-right tabular-nums">{pkg.bus_factor}</TableCell>
              <TableCell className="text-right tabular-nums text-muted-foreground text-xs">
                {pkg.weekly_downloads.toLocaleString()}
              </TableCell>
              <TableCell className="text-muted-foreground text-xs">
                {pkg.last_commit_at
                  ? new Date(pkg.last_commit_at).toLocaleDateString()
                  : "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
