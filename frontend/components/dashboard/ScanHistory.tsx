"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { Skeleton } from "@/components/ui/skeleton"
import { RiskBadge } from "@/components/shared/RiskBadge"
import { FileJson, FileText, FileCode2, ChevronRight, Inbox } from "lucide-react"
import api from "@/lib/api"
import type { Scan } from "@/types/scan"

function fileIcon(name: string) {
  if (name.endsWith(".json")) return <FileJson className="h-4 w-4 text-teal-600" />
  if (name.endsWith(".toml") || name.endsWith(".txt")) return <FileText className="h-4 w-4 text-teal-600" />
  return <FileCode2 className="h-4 w-4 text-teal-600" />
}

export function ScanHistory() {
  const [scans, setScans] = useState<Scan[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<Scan[]>("/history").then((r) => setScans(r.data)).finally(() => setLoading(false))
  }, [])

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Recent scans</h2>
          {!loading && scans.length > 0 && (
            <p className="text-xs text-gray-500 mt-0.5">{scans.length} scan{scans.length !== 1 ? "s" : ""} total</p>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="divide-y divide-gray-50">
        {loading ? (
          <div className="p-5 space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-lg shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-40" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : scans.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-14 px-6 text-center">
            <div className="h-12 w-12 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-center">
              <Inbox className="h-5 w-5 text-gray-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">No scans yet</p>
              <p className="text-xs text-gray-500 mt-0.5">Upload a file above to get started.</p>
            </div>
          </div>
        ) : (
          scans.map((scan) => (
            <Link
              key={scan.id}
              href={`/scan/${scan.id}`}
              className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50/80 transition-colors group"
            >
              {/* File icon */}
              <div className="h-9 w-9 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center shrink-0 group-hover:bg-teal-100 transition-colors">
                {fileIcon(scan.filename)}
              </div>

              {/* Name + meta */}
              <div className="flex-1 min-w-0">
                <p className="font-mono text-sm font-medium text-gray-900 truncate">{scan.filename}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {formatDistanceToNow(new Date(scan.created_at), { addSuffix: true })}
                  <span className="mx-1.5 text-gray-300">·</span>
                  {scan.summary.total_packages} packages
                </p>
              </div>

              {/* Risk summary */}
              <div className="flex items-center gap-2 shrink-0">
                {scan.status !== "completed" ? (
                  <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-0.5 font-medium capitalize">
                    {scan.status}
                  </span>
                ) : (
                  <div className="flex items-center gap-1.5">
                    {scan.summary.high_risk > 0 && <RiskBadge label="HIGH" />}
                    <span className="text-xs text-gray-500 font-mono tabular-nums">
                      {scan.summary.high_risk}H&nbsp;·&nbsp;{scan.summary.medium_risk}M&nbsp;·&nbsp;{scan.summary.low_risk}L
                    </span>
                  </div>
                )}
                <ChevronRight className="h-3.5 w-3.5 text-gray-300 group-hover:text-gray-500 transition-colors" />
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
