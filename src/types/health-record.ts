export interface HealthRecordRequest {
  recordDate: string
  assessment: string
  recommendation?: string
}

export interface HealthRecordResponse extends HealthRecordRequest {
  id: number
  customerId: number
  createdById: number
  createdByName: string
  createdAt: string
  updatedAt: string
}
