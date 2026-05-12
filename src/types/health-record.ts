/** 对应后端 RecordRequest — assessment / recommendation / recordDate */
export interface HealthRecordRequest {
  recordDate: string
  assessment: string
  recommendation?: string
}

/** 对应后端 RecordResponse — 与后端字段完全对齐 */
export interface HealthRecordResponse {
  id: number
  customerId: number
  assessment: string
  recommendation: string
  recordDate: string
  createdBy: number
  createdByName: string
  createdAt: string
}
