export interface UserUpsertRequest {
  username: string
  password?: string
  role: string
  displayName: string
  phone?: string
  active: boolean
}