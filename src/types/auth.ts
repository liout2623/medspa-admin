export interface CaptchaResponse {
  captchaId: string
  imageBase64: string
}

export interface RegisterRequest {
  username: string
  password: string
  displayName: string
  phone?: string
  occupation?: string
  captchaId: string
  captchaCode: string
}

export interface UserResponse {
  id: number
  username: string
  role: string
  displayName: string
  phone?: string
  occupation?: string
  active: boolean
}
