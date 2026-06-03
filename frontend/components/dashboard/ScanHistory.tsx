"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { RiskBadge } from "@/components/shared/RiskBadge"
import { Badge } from "@/components/ui/badge"
import api from "@/lib/api"
import type { Scan } from "@/types/scan"

export function ScanHistory() {
  const [scans, setScans] = useState<Scan[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<Scan[]>("/history").then((r) => setScans(r.data)).finally(() => setLoading(false))
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Recent scans</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : scans.length === 0 ? (
          <p className="text-muted-foreground text-sm">No scans yet. Upload a file above.</p>
        ) : (
          <div className="divide-y divide-border">
            {scans.map((scan) => (
              <Link
                key={scan.id}
                href={`/scan/${scan.id}`}
                className="flex items-center justify-between py-3 hover:bg-secondary/30 px-2 rounded-md transition-colors"
              >
                <div>
                  <p className="font-mono text-sm font-medium">{scan.filename}</p>
                  <p className="text-muted-foreground text-xs mt-0.5">
                    {formatDistanceToNow(new Date(scan.created_at), { addSuffix: true })}
                    {" · "}{scan.summary.total_packages} packages
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {scan.status !== "completed" ? (
                    <Badge variant="outline" className="text-xs capitalize">
                      {scan.status}
                    </Badge>
                  ) : (
                    <>
                      {scan.summary.high_risk > 0 && (
                        <RiskBadge label="HIGH" />
                      )}
                      <span className="text-muted-foreground text-xs">
                        {scan.summary.high_risk}H · {scan.summary.medium_risk}M · {scan.summary.low_risk}L
                      </span>
                    </>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
