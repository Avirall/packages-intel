"use client"

import { useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useScan } from "@/hooks/useScan"
import api from "@/lib/api"
import type { GraphData } from "@/types/scan"

const RISK_COLORS: Record<string, string> = {
  HIGH:   "#ef4444",
  MEDIUM: "#f59e0b",
  LOW:    "#22c55e",
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
        size: n.labels.includes("Package") ? Math.min(12 + Math.log10(Number(n.properties.weekly_downloads ?? 1) + 1) * 4, 28) : 8,
      }))

      const rels = data.relationships.map((r) => ({
        id: r.id,
        from: r.startNodeId,
        to: r.endNodeId,
        caption: r.type,
        color: "#4b5563",
      }))

      if (containerRef.current) {
        nvlInstance = new (InteractiveNvlWrapper as unknown as new (
          el: HTMLDivElement,
          nodes: unknown[],
          rels: unknown[],
          opts: unknown
        ) => typeof nvlInstance)(containerRef.current, nodes, rels, {
          layout: "hierarchical",
          renderer: "canvas",
        })
      }
    }

    initGraph()
    return () => { nvlInstance?.destroy?.() }
  }, [scan, scanId])

  if (loading) return <Skeleton className="h-96 w-full" />

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Dependency graph</CardTitle>
        <p className="text-xs text-muted-foreground">
          Red = HIGH · Amber = MEDIUM · Green = LOW · Size = weekly downloads
        </p>
      </CardHeader>
      <CardContent>
        <div ref={containerRef} className="h-96 rounded-md bg-secondary/20 overflow-hidden" />
      </CardContent>
    </Card>
  )
}
