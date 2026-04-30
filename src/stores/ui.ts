import { defineStore } from 'pinia'

type ToastType = 'success' | 'error' | 'info'
type ThemeMode = 'light' | 'dark'

const THEME_KEY = 'medspa-theme-mode'

const applyThemeClass = (mode: ThemeMode) => {
  if (typeof document === 'undefined') return
  document.documentElement.classList.toggle('dark', mode === 'dark')
  document.documentElement.style.colorScheme = mode
}

export const useUiStore = defineStore('ui', {
  state: () => ({
    toastVisible: false,
    toastMessage: '',
    toastType: 'info' as ToastType,
    themeMode: 'light' as ThemeMode,
    confirmVisible: false,
    confirmTitle: '请确认',
    confirmMessage: '',
    confirmLoading: false as boolean,
    _resolver: null as null | ((v: boolean) => void)
  }),
  actions: {
    initTheme() {
      if (typeof window === 'undefined') return
      const saved = window.localStorage.getItem(THEME_KEY)
      const mode: ThemeMode = saved === 'dark' || saved === 'light'
        ? saved
        : window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      this.themeMode = mode
      applyThemeClass(mode)
      window.localStorage.setItem(THEME_KEY, mode)
    },
    setTheme(mode: ThemeMode) {
      this.themeMode = mode
      applyThemeClass(mode)
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(THEME_KEY, mode)
      }
    },
    toggleTheme() {
      this.setTheme(this.themeMode === 'dark' ? 'light' : 'dark')
    },
    toast(message: string, type: ToastType = 'info', duration = 2200) {
      this.toastMessage = message
      this.toastType = type
      this.toastVisible = true
      window.setTimeout(() => {
        this.toastVisible = false
      }, duration)
    },
    confirm(title: string, message: string) {
      this.confirmTitle = title
      this.confirmMessage = message
      this.confirmVisible = true
      return new Promise<boolean>((resolve) => {
        this._resolver = resolve
      })
    },
    resolveConfirm(result: boolean) {
      this.confirmVisible = false
      this.confirmLoading = false
      if (this._resolver) this._resolver(result)
      this._resolver = null
    }
  }
})