"use client"

import { useEffect, useRef } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { GitBranch } from "lucide-react"
import { useScan } from "@/hooks/useScan"
import api from "@/lib/api"
import type { GraphData } from "@/types/scan"

const RISK_COLORS: Record<string, string> = {
  HIGH:   "#ef4444",
  MEDIUM: "#f59e0b",
  LOW:    "#14b8a6",
}

export function GraphCanvas({ scanId }: { scanId: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scan, loading } = useScan(scanId)

  useEffect(() => {
    if (!scan || scan.status !== "completed" || !containerRef.current) return
    let nvlInstance: { destroy?: () => void } | null = null

    const initGraph = async () => {
      const { data }: { data: GraphData } = await api.get(`/scan/${scanId}/graph`)
      const { InteractiveNvlWrapper } = await import("@neo4j-nvl/react")

      const nodes = data.nodes.map((n) => ({
        id: n.id,
        captions: [{ value: String(n.properties.name ?? n.id) }],
        color: RISK_COLORS[String(n.properties.risk_label ?? "")] ?? "#6366f1",
        size: n.labels.includes("Package")
          ? Math.min(12 + Math.log10(Number(n.properties.weekly_downloads ?? 1) + 1) * 4, 28)
          : 8,
      }))
      const rels = data.relationships.map((r) => ({
        id: r.id, from: r.startNodeId, to: r.endNodeId, caption: r.type, color: "#d1d5db",
      }))
      if (containerRef.current) {
        nvlInstance = new (InteractiveNvlWrapper as unknown as new (
          el: HTMLDivElement, nodes: unknown[], rels: unknown[], opts: unknown
        ) => typeof nvlInstance)(containerRef.current, nodes, rels, { layout: "hierarchical", renderer: "canvas" })
      }
    }
    initGraph()
    return () => { nvlInstance?.destroy?.() }
  }, [scan, scanId])

  if (loading) return <Skeleton className="h-96 w-full rounded-2xl" />

  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2.5">
        <div className="h-7 w-7 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center">
          <GitBranch className="h-3.5 w-3.5 text-teal-600" />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900">Dependency graph</p>
          <p className="text-xs text-gray-500">
            <span className="inline-flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-red-400 inline-block" /> HIGH</span>
            {" · "}
            <span className="inline-flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-amber-400 inline-block" /> MEDIUM</span>
            {" · "}
            <span className="inline-flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-teal-400 inline-block" /> LOW</span>
            {" · Size = weekly downloads"}
          </p>
        </div>
      </div>
      <div className="p-3">
        <div ref={containerRef} className="h-96 rounded-xl bg-gray-50 overflow-hidden" />
      </div>
    </div>
  )
}
