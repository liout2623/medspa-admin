const USER_KEY = 'user'

export function getUser() {
  const raw = localStorage.getItem(USER_KEY)
  return raw ? JSON.parse(raw) : null
}
export function setUser(user: any) {
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}
export function clearUser() {
  localStorage.removeItem(USER_KEY)
}
