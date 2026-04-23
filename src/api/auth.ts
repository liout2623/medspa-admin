import http from './http'
import type { ApiResponse } from '../types/common'
import type { LoginResponse, RegisterRequest, UserResponse } from '../types/auth'

export function login(data: { username: string; password: string }) {
  return http.post<ApiResponse<LoginResponse>>('/auth/login', data)
}

export function register(data: RegisterRequest) {
  return http.post<ApiResponse<UserResponse>>('/auth/register', data)
}