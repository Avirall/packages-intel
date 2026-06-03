import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { RiskLabel } from "@/types/scan"

const styles: Record<RiskLabel, string> = {
  HIGH:   "bg-red-500/15 text-red-400 border-red-500/30",
  MEDIUM: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  LOW:    "bg-green-500/15 text-green-400 border-green-500/30",
}

export function RiskBadge({ label }: { label: RiskLabel }) {
  return (
    <Badge variant="outline" className={cn("font-mono text-xs", styles[label])}>
      {label}
    </Badge>
  )
}
