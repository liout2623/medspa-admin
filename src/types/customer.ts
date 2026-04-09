export interface CustomerRequest {
  name: string
  phone?: string
  email?: string
  gender?: string
  tags?: string
  note?: string
  birthday?: string
}

export interface CustomerResponse extends CustomerRequest {
  id: number
  createdAt?: string
  updatedAt?: string
}