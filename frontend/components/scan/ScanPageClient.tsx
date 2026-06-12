"use client"

import { useScan } from "@/hooks/useScan"
import { ScanPending } from "./ScanPending"
import { SummaryCards } from "./SummaryCards"
import { RiskDonut } from "./RiskDonut"
import { RiskBarChart } from "./RiskBarChart"
import { RiskTable } from "./RiskTable"
import { ScatterPlot } from "./ScatterPlot"
import { GraphCanvas } from "./GraphCanvas"
import { ChatPanel } from "./ChatPanel"
import { AlertTriangle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function ScanPageClient({ scanId }: { scanId: string }) {
  const { scan, loading } = useScan(scanId)

  // While initially loading
  if (loading) {
    return <ScanPending />
  }

  // Scan still processing
  if (scan && (scan.status === "pending" || scan.status === "processing")) {
    return <ScanPending filename={scan.filename} />
  }

  // Scan failed
  if (scan?.status === "failed") {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-6">
        <div className="h-16 w-16 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center">
          <AlertTriangle className="h-8 w-8 text-red-500" />
        </div>
        <div className="text-center space-y-1">
          <h2 className="text-lg font-semibold text-gray-900">Scan failed</h2>
          <p className="text-sm text-gray-500 max-w-xs">
            Something went wrong while analyzing{scan.filename ? ` ${scan.filename}` : " your dependencies"}.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/dashboard">
            <RefreshCw className="h-4 w-4" />
            Try another file
          </Link>
        </Button>
      </div>
    )
  }

  // Completed — render full dashboard
  return (
    <div className="max-w-[1400px] mx-auto px-6 py-8 space-y-8">
      <SummaryCards scanId={scanId} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <RiskDonut scanId={scanId} />
        <div className="lg:col-span-2">
          <RiskBarChart scanId={scanId} />
        </div>
      </div>

      <ScatterPlot scanId={scanId} />

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <div className="xl:col-span-3 space-y-6">
          <GraphCanvas scanId={scanId} />
          <RiskTable scanId={scanId} />
        </div>
        <div className="xl:col-span-2">
          <ChatPanel scanId={scanId} />
        </div>
      </div>
    </div>
  )
}
