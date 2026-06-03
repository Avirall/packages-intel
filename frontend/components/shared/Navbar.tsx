"use client"

import Link from "next/link"
import { Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/useAuth"

export function Navbar() {
  const { user, logout } = useAuth()

  return (
    <nav className="border-b border-border px-6 py-3 flex items-center justify-between">
      <Link href="/dashboard" className="flex items-center gap-2 font-semibold text-sm">
        <Shield className="h-4 w-4 text-primary" />
        OSS Sentinel
      </Link>

      <div className="flex items-center gap-3">
        {user && (
          <span className="text-sm text-muted-foreground hidden sm:block">
            {user.username}
          </span>
        )}
        <Button variant="ghost" size="sm" onClick={logout}>
          Sign out
        </Button>
      </div>
    </nav>
  )
}
