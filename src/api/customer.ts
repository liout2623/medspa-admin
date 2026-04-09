import http from './http'
import type { ApiResponse, PageResponse } from '../types/common'
import type { CustomerRequest, CustomerResponse } from '../types/customer'

export function listCustomers(params: { page: number; size: number; keyword?: string }) {
  return http.get<ApiResponse<PageResponse<CustomerResponse>>>('/customers', { params })
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