import { Shield } from "lucide-react"
import { UploadZone } from "@/components/dashboard/UploadZone"
import { ScanHistory } from "@/components/dashboard/ScanHistory"

export default function DashboardPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-10 space-y-8">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4 pb-6 border-b border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1 max-w-sm">
            Upload a dependency manifest to analyze succession risk across your stack.
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-gray-400 border border-gray-200 rounded-full px-3 py-1.5 bg-white shadow-xs shrink-0 mt-1 font-medium">
          <span className="h-1.5 w-1.5 rounded-full bg-teal-500 shrink-0" />
          Neo4j Aura · Live
        </div>
      </div>

      {/* Upload */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-teal-600" />
          <h2 className="text-sm font-semibold text-gray-800">New scan</h2>
        </div>
        <UploadZone />
      </div>

      {/* History */}
      <ScanHistory />
    </div>
  )
}
