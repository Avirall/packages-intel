"use client"

import { useEffect, useState } from "react"
import api from "@/lib/api"
import type { Scan, PackageRisk } from "@/types/scan"

export function useScan(scanId: string) {
  const [scan, setScan] = useState<Scan | null>(null)
  const [packages, setPackages] = useState<PackageRisk[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!scanId) return

    const fetchScan = async () => {
      try {
        const [scanRes, pkgRes] = await Promise.all([
          api.get<Scan>(`/scan/${scanId}`),
          api.get<PackageRisk[]>(`/scan/${scanId}/packages`),
        ])
        setScan(scanRes.data)
        setPackages(pkgRes.data)
      } catch {
        setError("Failed to load scan data")
      } finally {
        setLoading(false)
      }
    }

    // poll while processing
    fetchScan()
    const interval = setInterval(async () => {
      const res = await api.get<Scan>(`/scan/${scanId}`)
      setScan(res.data)
      if (res.data.status === "completed" || res.data.status === "failed") {
        clearInterval(interval)
        if (res.data.status === "completed") {
          const pkgRes = await api.get<PackageRisk[]>(`/scan/${scanId}/packages`)
          setPackages(pkgRes.data)
        }
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [scanId])

  return { scan, packages, loading, error }
}
