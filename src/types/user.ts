export interface UserUpsertRequest {
  username: string
  password?: string
  role: string
  displayName: string
  phone?: string
  active: boolean
}

/** 用户表单内部状态（activeText 为字符串，提交时转为 boolean） */
export interface UserForm {
  username: string
  password: string
  displayName: string
  role: string
  phone: string
  activeText: string
}