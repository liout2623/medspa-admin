<template>
  <div class="coze-chat-host">
    <!-- SDK mounts its own floating button & chat window; no custom UI here -->
    <div ref="containerRef" class="coze-container" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'

/* ── Props ── */
const props = withDefaults(defineProps<{ locale?: 'zh' | 'en' }>(), {
  locale: 'zh'
})

/* ── State ── */
const containerRef = ref<HTMLElement | null>(null)
let clientInstance: any = null          // CozeWebSDK.WebChatClient instance
let sdkScript: HTMLScriptElement | null = null

/* ── Computed ── */
const chatTitle = computed(() =>
  props.locale === 'zh' ? '艾灸小助手' : 'Moxibustion Assistant'
)
const chatLang = computed<'zh-CN' | 'en'>(() =>
  props.locale === 'zh' ? 'zh-CN' : 'en'
)

/* ── Constants ── */
const COZE_SDK_SRC =
  'https://lf-cdn.coze.cn/obj/unpkg/flow-platform/chat-app-sdk/1.2.0-beta.19/libs/cn/index.js'
const BOT_ID = '7569085944977047561'

/* ── Load SDK script ── */
function loadSdk(): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as any).CozeWebSDK) {
      resolve()
      return
    }
    const script = document.createElement('script')
    script.src = COZE_SDK_SRC
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Coze SDK'))
    document.body.appendChild(script)
    sdkScript = script
  })
}

/* ── Initialise / re-initialise chat client ── */
function initClient() {
  const CozeWebSDK = (window as any).CozeWebSDK
  if (!CozeWebSDK) return

  // Destroy previous instance if any
  destroyClient()

  const cozeToken = import.meta.env.VITE_COZE_TOKEN || ''

  clientInstance = new CozeWebSDK.WebChatClient({
    config: {
      type: 'bot',
      bot_id: BOT_ID,
      isIframe: false,
    },
    auth: {
      type: 'token',
      token: cozeToken,
      onRefreshToken: async () => cozeToken,
    },
    userInfo: {
      id: 'user',
      url: 'https://i.ibb.co/x8rq7w7X/icon-icons-1.png',
      nickname: '您',
    },
    ui: {
      base: {
        icon: 'https://i.ibb.co/998G0b4q/icon-icons.png',
        layout: 'pc',
        lang: chatLang.value,
        zIndex: 1000,
      },
      header: {
        isShow: true,
        isNeedClose: true,
      },
      asstBtn: {
        isNeed: true,
      },
      footer: {
        isShow: false,
      },
      chatBot: {
        title: chatTitle.value,
        uploadable: false,
        width: 390,
        isNeedAudio: true,
      },
    },
  })
}

/* ── Destroy client instance ── */
function destroyClient() {
  if (clientInstance) {
    try { clientInstance.destroy?.() } catch { /* noop */ }
    clientInstance = null
  }
  // Remove any SDK-injected DOM nodes inside our container
  if (containerRef.value) {
    containerRef.value.innerHTML = ''
  }
}

/* ── Auto-load on mount ── */
onMounted(async () => {
  try {
    await loadSdk()
    initClient()
  } catch (e) {
    console.error('[CozeChat] SDK auto-load failed:', e)
  }
})

/* ── Re-init on locale change ── */
watch(chatLang, () => {
  initClient()
})

/* ── Cleanup ── */
onBeforeUnmount(() => {
  destroyClient()
  if (sdkScript && sdkScript.parentNode) {
    sdkScript.parentNode.removeChild(sdkScript)
  }
})
</script>

<style scoped>
.coze-chat-host {
  /* Container is invisible; SDK positions its own UI */
  position: relative;
  z-index: 9999;
}

/* SDK container (invisible — the SDK creates its own positioned elements) */
.coze-container {
  display: none;
}
</style>
