import http from './http'
import type { ApiResponse, PageResponse } from '../types/common'
import type { UserResponse } from '../types/auth'
import type { UserUpsertRequest } from '../types/user'

export function listUsers(params: { page: number; size: number; keyword?: string; role?: string; active?: boolean; sort?: string }) {
  return http.get<ApiResponse<PageResponse<UserResponse>>>('/users', { params })
}
export function createUser(data: UserUpsertRequest) {
  return http.post<ApiResponse<UserResponse>>('/users', data)
}
export function updateUser(id: number, data: UserUpsertRequest) {
  return http.put<ApiResponse<UserResponse>>(`/users/${id}`, data)
}
export function deleteUser(id: number) {
  return http.delete<ApiResponse<null>>(`/users/${id}`)
}
export function exportUsers(params: { keyword?: string; role?: string; active?: boolean }) {
  return http.get('/users/export', { params, responseType: 'blob' })
}
