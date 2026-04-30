import http from './http'
import type { ApiResponse, PageResponse } from '../types/common'

export interface ServiceRequest {
  name: string
  description?: string
  price?: number
  durationMinutes?: number
  active?: boolean
}

export interface ServiceResponse extends ServiceRequest {
  id: number
  createdAt?: string
  updatedAt?: string
}

export function listServices(params: { page: number; size: number; keyword?: string; active?: boolean; sort?: string }) {
  return http.get<ApiResponse<PageResponse<ServiceResponse>>>('/services', { params })
}

export function getService(id: number) {
  return http.get<ApiResponse<ServiceResponse>>(`/services/${id}`)
}

export function createService(data: ServiceRequest) {
  return http.post<ApiResponse<ServiceResponse>>('/services', data)
}

export function updateService(id: number, data: ServiceRequest) {
  return http.put<ApiResponse<ServiceResponse>>(`/services/${id}`, data)
}

export function deleteService(id: number) {
  return http.delete<ApiResponse<null>>(`/services/${id}`)
}

export function toggleServiceStatus(id: number) {
  return http.patch<ApiResponse<ServiceResponse>>(`/services/${id}/toggle`)
}
