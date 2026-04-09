import http from './http'
import type { ApiResponse } from '../types/common'
import type { LoginResponse } from '../types/auth'

export function login(data: { username: string; password: string }) {
  return http.post<ApiResponse<LoginResponse>>('/auth/login', data)
}