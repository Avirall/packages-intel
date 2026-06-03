import { SummaryCards } from "@/components/scan/SummaryCards"
import { RiskDonut } from "@/components/scan/RiskDonut"
import { RiskBarChart } from "@/components/scan/RiskBarChart"
import { RiskTable } from "@/components/scan/RiskTable"
import { GraphCanvas } from "@/components/scan/GraphCanvas"
import { ChatPanel } from "@/components/scan/ChatPanel"

export default function ScanPage({ params }: { params: { id: string } }) {
  return (
    <div className="max-w-[1400px] mx-auto px-6 py-8 space-y-8">
      <SummaryCards scanId={params.id} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <RiskDonut scanId={params.id} />
        <div className="lg:col-span-2">
          <RiskBarChart scanId={params.id} />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <div className="xl:col-span-3 space-y-6">
          <GraphCanvas scanId={params.id} />
          <RiskTable scanId={params.id} />
        </div>
        <div className="xl:col-span-2">
          <ChatPanel scanId={params.id} />
        </div>
      </div>
    </div>
  )
}
