"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { RiskBadge } from "@/components/shared/RiskBadge"
import { useScan } from "@/hooks/useScan"

export function RiskTable({ scanId }: { scanId: string }) {
  const { packages, loading } = useScan(scanId)

  if (loading) return <Skeleton className="h-64 w-full rounded-2xl" />

  const sorted = [...packages].sort((a, b) => b.risk_score - a.risk_score)

  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
      {/* Table header */}
      <div className="px-5 py-4 border-b border-gray-100">
        <p className="text-sm font-semibold text-gray-900">Package risk details</p>
        <p className="text-xs text-gray-500 mt-0.5">Sorted by risk score, highest first</p>
      </div>
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50/70 hover:bg-gray-50/70 border-b border-gray-100">
            <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide pl-5">Package</TableHead>
            <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Risk</TableHead>
            <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Bus factor</TableHead>
            <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Downloads/wk</TableHead>
            <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide pr-5">Last commit</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((pkg) => (
            <TableRow key={pkg.name} className="hover:bg-gray-50/60 border-b border-gray-50 last:border-0">
              <TableCell className="font-mono text-sm font-medium text-gray-900 pl-5">{pkg.name}</TableCell>
              <TableCell><RiskBadge label={pkg.risk_label} /></TableCell>
              <TableCell className="text-right tabular-nums text-gray-700">{pkg.bus_factor}</TableCell>
              <TableCell className="text-right tabular-nums text-gray-500 text-xs">
                {pkg.weekly_downloads.toLocaleString()}
              </TableCell>
              <TableCell className="text-gray-500 text-xs pr-5">
                {pkg.last_commit_at ? new Date(pkg.last_commit_at).toLocaleDateString() : "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
