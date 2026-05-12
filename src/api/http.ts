import axios from 'axios'
import router from '../router'
import { clearUser } from '../utils/token'

const http = axios.create({
  baseURL: '/api',
  timeout: 10000,
  withCredentials: true   // 自动携带 HttpOnly Cookie
})

http.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      clearUser()
      router.push('/login')
    }
    return Promise.reject(err)
  }
)

export default http
