export type AppointmentStatus = 'BOOKED' | 'COMPLETED' | 'CANCELLED'

export interface AppointmentRequest {
  customerId: number
  serviceId: number
  therapistId: number
  appointmentTime: string
  note?: string
}

export interface AppointmentResponse {
  id: number
  customerId: number
  customerName: string
  serviceId: number
  serviceName: string
  therapistId: number
  therapistName: string
  appointmentTime: string
  endTime: string
  durationMinutes: number
  status: AppointmentStatus
  note?: string
  createdAt: string
  updatedAt: string
}
