import http from './http'
import type { ApiResponse } from '../types/common'
import type { CaptchaResponse, RegisterRequest, UserResponse } from '../types/auth'

type ChangePasswordRequest = {
  currentPassword: string
  newPassword: string
}

type DeleteAccountRequest = {
  currentPassword: string
}

export function login(data: { username: string; password: string }) {
  return http.post<ApiResponse<UserResponse>>('/auth/login', data)
}

export function logout() {
  return http.post<ApiResponse<null>>('/auth/logout')
}

export function getCaptcha() {
  return http.get<ApiResponse<CaptchaResponse>>('/auth/captcha')
}

export function register(data: RegisterRequest) {
  return http.post<ApiResponse<UserResponse>>('/auth/register', data)
}

export function changePassword(data: ChangePasswordRequest) {
  return http.put<ApiResponse<null>>('/users/me/password', data)
}

export function deleteCurrentAccount(data: DeleteAccountRequest) {
  return http.delete<ApiResponse<null>>('/users/me', { data })
}
