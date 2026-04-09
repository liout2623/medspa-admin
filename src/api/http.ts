import axios from 'axios'
import router from '../router'
import { getToken, clearToken, clearUser } from '../utils/token'

const http = axios.create({
  baseURL: '/api',
  timeout: 10000
})

http.interceptors.request.use((config) => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

http.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      clearToken()
      clearUser()
      router.push('/login')
    }
    return Promise.reject(err)
  }
)

export default http