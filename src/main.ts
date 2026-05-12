import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import i18n from './locales'
import './assets/theme.css'
import { useUiStore } from './stores/ui'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia).use(router).use(i18n)

const ui = useUiStore(pinia)
ui.initTheme()

app.mount('#app')