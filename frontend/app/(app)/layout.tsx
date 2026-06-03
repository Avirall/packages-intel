"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { tokenStore } from "@/lib/auth"
import { Navbar } from "@/components/shared/Navbar"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()

  useEffect(() => {
    if (!tokenStore.getAccess()) router.replace("/login")
  }, [router])

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
    </div>
  )
}
