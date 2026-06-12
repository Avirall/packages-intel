"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/hooks/useAuth"
import { Loader2 } from "lucide-react"

export function RegisterForm() {
  const { register } = useAuth()
  const [email, setEmail] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      await register(email, username, password)
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(msg ?? "Registration failed")
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    "bg-white border-gray-200 focus:border-primary/60 focus:ring-primary/15 placeholder:text-muted-foreground/50 h-10"
  const labelClass =
    "text-xs font-medium text-muted-foreground uppercase tracking-wide"

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="email" className={labelClass}>Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="username" className={labelClass}>Username</Label>
        <Input
          id="username"
          placeholder="yourhandle"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className={inputClass}
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password" className={labelClass}>Password</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          placeholder="min. 8 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
          required
        />
      </div>

      {error && (
        <p className="text-destructive text-sm bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <Button
        type="submit"
        className="w-full h-10 shadow-md shadow-primary/20 gap-2 mt-1"
        disabled={loading}
      >
        {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        {loading ? "Creating account…" : "Create account"}
      </Button>
    </form>
  )
}
