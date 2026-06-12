"use client"

import Link from "next/link"
import { Shield, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/useAuth"

export function Navbar() {
  const { user, logout } = useAuth()

  return (
    <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
      <div className="px-6 h-14 flex items-center justify-between">
        {/* Brand */}
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div className="h-8 w-8 rounded-lg bg-teal-600 flex items-center justify-center shadow-sm group-hover:bg-teal-700 transition-colors">
            <Shield className="h-4 w-4 text-white" />
          </div>
          <span className="font-semibold text-sm text-gray-900 tracking-tight">OSS Sentinel</span>
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {user && (
            <div className="hidden sm:flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-full pl-1.5 pr-3 py-1">
              <div className="h-5 w-5 rounded-full bg-teal-100 border border-teal-200 flex items-center justify-center text-[10px] font-bold text-teal-700 uppercase shrink-0">
                {user.username[0]}
              </div>
              <span className="text-xs font-medium text-gray-700">{user.username}</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="text-gray-500 hover:text-gray-900 gap-1.5"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Sign out</span>
          </Button>
        </div>
      </div>
    </nav>
  )
}
