export interface UserResponse {
  id: number
  username: string
  role: string
  displayName: string
  phone?: string
  active: boolean
}

export interface LoginResponse {
  token: string
  user: UserResponse
}