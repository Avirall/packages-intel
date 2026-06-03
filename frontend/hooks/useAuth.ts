"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import api from "@/lib/api"
import { tokenStore } from "@/lib/auth"
import type { User, TokenResponse } from "@/types/user"

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    if (!tokenStore.getAccess()) {
      setLoading(false)
      return
    }
    api
      .get<User>("/auth/me")
      .then((r) => setUser(r.data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  const login = async (email: string, password: string) => {
    const { data } = await api.post<TokenResponse>("/auth/login", { email, password })
    tokenStore.set(data.access_token, data.refresh_token)
    const me = await api.get<User>("/auth/me")
    setUser(me.data)
    router.push("/dashboard")
  }

  const register = async (email: string, username: string, password: string) => {
    await api.post("/auth/register", { email, username, password })
    await login(email, password)
  }

  const logout = () => {
    tokenStore.clear()
    setUser(null)
    router.push("/login")
  }

  return { user, loading, login, register, logout }
}
