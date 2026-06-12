import { use } from "react"
import { ScanPageClient } from "@/components/scan/ScanPageClient"

export default function ScanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  return <ScanPageClient scanId={id} />
}
