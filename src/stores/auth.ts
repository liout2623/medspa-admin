import { defineStore } from 'pinia'
import { login } from '../api/auth'
import { getToken, setToken, clearToken, getUser, setUser, clearUser } from '../utils/token'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: '',
    user: null as any
  }),
  actions: {
    init() {
      this.token = getToken()
      this.user = getUser()
    },
    async doLogin(payload: { username: string; password: string }) {
      const res = await login(payload)
      const data = res.data.data
      this.token = data.token
      this.user = data.user
      setToken(data.token)
      setUser(data.user)
    },
    logout() {
      this.token = ''
      this.user = null
      clearToken()
      clearUser()
    }
  }
})