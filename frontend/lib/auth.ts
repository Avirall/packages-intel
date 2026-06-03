const ACCESS_KEY = "oss_access_token"
const REFRESH_KEY = "oss_refresh_token"

export const tokenStore = {
  getAccess: (): string | null =>
    typeof window !== "undefined" ? localStorage.getItem(ACCESS_KEY) : null,

  getRefresh: (): string | null =>
    typeof window !== "undefined" ? localStorage.getItem(REFRESH_KEY) : null,

  set: (access: string, refresh: string): void => {
    localStorage.setItem(ACCESS_KEY, access)
    localStorage.setItem(REFRESH_KEY, refresh)
  },

  clear: (): void => {
    localStorage.removeItem(ACCESS_KEY)
    localStorage.removeItem(REFRESH_KEY)
  },
}
