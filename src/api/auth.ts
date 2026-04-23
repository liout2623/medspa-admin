import http from './http'
import type { ApiResponse } from '../types/common'
import type { LoginResponse, RegisterRequest, UserResponse } from '../types/auth'

type ChangePasswordRequest = {
  currentPassword: string
  newPassword: string
}

export function login(data: { username: string; password: string }) {
  return http.post<ApiResponse<LoginResponse>>('/auth/login', data)
}

export function register(data: RegisterRequest) {
  return http.post<ApiResponse<UserResponse>>('/auth/register', data)
}

export function changePassword(data: ChangePasswordRequest) {
  return http.put<ApiResponse<null>>('/users/me/password', data)
}

export function deleteCurrentAccount() {
  return http.delete<ApiResponse<null>>('/users/me')
}