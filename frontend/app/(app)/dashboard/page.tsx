import { UploadZone } from "@/components/dashboard/UploadZone"
import { ScanHistory } from "@/components/dashboard/ScanHistory"

export default function DashboardPage() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-10 space-y-10">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Upload a dependency file to scan your project for succession risk.
        </p>
      </div>
      <UploadZone />
      <ScanHistory />
    </div>
  )
}
