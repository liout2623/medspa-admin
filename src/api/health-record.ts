import http from './http'
import type { ApiResponse, PageResponse } from '../types/common'
import type { HealthRecordRequest, HealthRecordResponse } from '../types/health-record'

export function listHealthRecords(customerId: number, params: { page: number; size: number }) {
  return http.get<ApiResponse<PageResponse<HealthRecordResponse>>>(`/customers/${customerId}/records`, { params })
}

export function createHealthRecord(customerId: number, data: HealthRecordRequest) {
  return http.post<ApiResponse<HealthRecordResponse>>(`/customers/${customerId}/records`, data)
}

export function updateHealthRecord(customerId: number, id: number, data: HealthRecordRequest) {
  return http.put<ApiResponse<HealthRecordResponse>>(`/customers/${customerId}/records/${id}`, data)
}

export function deleteHealthRecord(customerId: number, id: number) {
  return http.delete<ApiResponse<null>>(`/customers/${customerId}/records/${id}`)
}
