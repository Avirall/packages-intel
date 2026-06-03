export interface User {
  id: string
  email: string
  username: string
}

export interface TokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
}
