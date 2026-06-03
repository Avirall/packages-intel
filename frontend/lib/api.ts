import axios from "axios"
import { tokenStore } from "@/lib/auth"
import type { TokenResponse } from "@/types/user"

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000",
  headers: { "Content-Type": "application/json" },
})

// attach access token on every request
api.interceptors.request.use((config) => {
  const token = tokenStore.getAccess()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// on 401: try refresh once, then redirect to login
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      const refresh = tokenStore.getRefresh()

      if (refresh) {
        try {
          const { data } = await axios.post<TokenResponse>(
            `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/auth/refresh`,
            { refresh_token: refresh }
          )
          tokenStore.set(data.access_token, data.refresh_token)
          original.headers.Authorization = `Bearer ${data.access_token}`
          return api(original)
        } catch {
          tokenStore.clear()
        }
      }

      tokenStore.clear()
      if (typeof window !== "undefined") window.location.href = "/login"
    }

    return Promise.reject(error)
  }
)

export default api
