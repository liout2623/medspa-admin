import http from './http'
import type { ApiResponse, PageResponse } from '../types/common'
import type { AppointmentRequest, AppointmentResponse, AppointmentStatus } from '../types/appointment'

export function listAppointments(params: {
  therapistId?: number
  customerId?: number
  date?: string
  startDate?: string
  endDate?: string
  status?: AppointmentStatus
  page?: number
  size?: number
  sort?: string
}) {
  return http.get<ApiResponse<PageResponse<AppointmentResponse>>>('/appointments', { params })
}

export function getAppointment(id: number) {
  return http.get<ApiResponse<AppointmentResponse>>(`/appointments/${id}`)
}

export function createAppointment(data: AppointmentRequest) {
  return http.post<ApiResponse<AppointmentResponse>>('/appointments', data)
}

export function updateAppointment(id: number, data: AppointmentRequest) {
  return http.put<ApiResponse<AppointmentResponse>>(`/appointments/${id}`, data)
}

export function updateAppointmentStatus(id: number, status: AppointmentStatus) {
  return http.patch<ApiResponse<AppointmentResponse>>(`/appointments/${id}/status`, { status })
}

export function deleteAppointment(id: number) {
  return http.delete<ApiResponse<null>>(`/appointments/${id}`)
}
