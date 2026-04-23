export interface RegisterRequest {
  username: string
  password?: string
  displayName?: string
  phone?: string
  occupation?: string
}

export interface UserResponse {
  id: number
  username: string
  role: string
  displayName: string
  phone?: string
  occupation?: string
  active: boolean
}

export interface LoginResponse {
  token: string
  user: UserResponse
}