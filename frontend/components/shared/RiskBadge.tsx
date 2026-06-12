import { cn } from "@/lib/utils"
import type { RiskLabel } from "@/types/scan"

const styles: Record<RiskLabel, string> = {
  HIGH:   "bg-red-50 text-red-700 border border-red-200 ring-1 ring-red-100",
  MEDIUM: "bg-amber-50 text-amber-700 border border-amber-200 ring-1 ring-amber-100",
  LOW:    "bg-green-50 text-green-700 border border-green-200 ring-1 ring-green-100",
}

export function RiskBadge({ label }: { label: RiskLabel }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold font-mono", styles[label])}>
      {label}
    </span>
  )
}
