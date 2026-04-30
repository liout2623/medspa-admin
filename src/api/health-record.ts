import http from './http'
import type { ApiResponse, PageResponse } from '../types/common'
import type { HealthRecordRequest, HealthRecordResponse } from '../types/health-record'

export function listHealthRecords(customerId: number, params: { page: number; size: number }) {
  return http.get<ApiResponse<PageResponse<HealthRecordResponse>>>(`/customers/${customerId}/health-records`, { params })
}

export function createHealthRecord(customerId: number, data: HealthRecordRequest) {
  return http.post<ApiResponse<HealthRecordResponse>>(`/customers/${customerId}/health-records`, data)
}

export function updateHealthRecord(customerId: number, id: number, data: HealthRecordRequest) {
  return http.put<ApiResponse<HealthRecordResponse>>(`/customers/${customerId}/health-records/${id}`, data)
}

export function deleteHealthRecord(customerId: number, id: number) {
  return http.delete<ApiResponse<null>>(`/customers/${customerId}/health-records/${id}`)
}
