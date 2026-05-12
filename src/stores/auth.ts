import { defineStore } from 'pinia'
import { login, logout as logoutApi } from '../api/auth'
import { getUser, setUser, clearUser } from '../utils/token'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as any
  }),
  getters: {
    isAuthenticated: (state) => !!state.user
  },
  actions: {
    init() {
      this.user = getUser()
    },
    async doLogin(payload: { username: string; password: string }) {
      const res = await login(payload)
      // Token 由后端写入 HttpOnly Cookie，前端仅保存用户信息
      const user = res.data.data
      this.user = user
      setUser(user)
    },
    async logout() {
      try {
        await logoutApi()
      } catch {
        // 即使后端 logout 失败，也清除前端状态（Cookie 自然过期）
      }
      this.user = null
      clearUser()
    }
  }
})
