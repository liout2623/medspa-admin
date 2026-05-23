import http from './http'
import type { ApiResponse } from '../types/common'
import type { ServiceResponse } from './service'

/** 获取指定理疗师负责的服务项目列表 */
export function getTherapistServices(therapistId: number) {
  return http.get<ApiResponse<ServiceResponse[]>>(`/therapist-services/${therapistId}`)
}

/** 为理疗师分配负责的服务项目 */
export function assignTherapistServices(data: { therapistId: number; serviceIds: number[] }) {
  return http.post<ApiResponse<null>>('/therapist-services', data)
}

/** 删除理疗师与服务的关联（可选） */
export function removeTherapistService(id: number) {
  return http.delete<ApiResponse<null>>(`/therapist-services/${id}`)
}
