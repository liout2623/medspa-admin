import { defineStore } from 'pinia'

type ToastType = 'success' | 'error' | 'info'

export const useUiStore = defineStore('ui', {
  state: () => ({
    toastVisible: false,
    toastMessage: '',
    toastType: 'info' as ToastType,
    confirmVisible: false,
    confirmTitle: '请确认',
    confirmMessage: '',
    confirmLoading: false as boolean,
    _resolver: null as null | ((v: boolean) => void)
  }),
  actions: {
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