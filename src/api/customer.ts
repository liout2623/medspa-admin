import http from './http'
import type { ApiResponse, PageResponse } from '../types/common'
import type { CustomerRequest, CustomerResponse } from '../types/customer'

export function listCustomers(params: { page: number; size: number; keyword?: string; sort?: string }) {
  return http.get<ApiResponse<PageResponse<CustomerResponse>>>('/customers', { params })
}
export function getCustomer(id: number) {
  return http.get<ApiResponse<CustomerResponse>>(`/customers/${id}`)
}
export function createCustomer(data: CustomerRequest) {
  return http.post<ApiResponse<CustomerResponse>>('/customers', data)
}
export function updateCustomer(id: number, data: CustomerRequest) {
  return http.put<ApiResponse<CustomerResponse>>(`/customers/${id}`, data)
}
export function deleteCustomer(id: number) {
  return http.delete<ApiResponse<null>>(`/customers/${id}`)
}
export function importCustomers(data: { customers: CustomerRequest[] }) {
  return http.post<ApiResponse<number>>('/customers/import', data)
}

export function exportCustomers(params?: { keyword?: string }) {
  return http.get<Blob>('/customers/export', {
    params,
    responseType: 'blob'
  })
}

// ==========================================
// Health Records API
// ==========================================

export interface HealthRecordResponse {
  id: number
  assessment: string
  recommendation: string
  recordDate: string
  createdByName: string
  createdBy: number
  createdAt: string
}

export interface HealthRecordRequest {
  assessment?: string
  recommendation?: string
  recordDate?: string
}

export function listHealthRecords(customerId: number, params: { page: number; size: number }) {
  return http.get<ApiResponse<PageResponse<HealthRecordResponse>>>(`/customers/${customerId}/records`, { params })
}

export function createHealthRecord(customerId: number, data: HealthRecordRequest) {
  return http.post<ApiResponse<HealthRecordResponse>>(`/customers/${customerId}/records`, data)
}

export function updateHealthRecord(customerId: number, recordId: number, data: HealthRecordRequest) {
  return http.put<ApiResponse<HealthRecordResponse>>(`/customers/${customerId}/records/${recordId}`, data)
}

export function deleteHealthRecord(customerId: number, recordId: number) {
  return http.delete<ApiResponse<null>>(`/customers/${customerId}/records/${recordId}`)
}
