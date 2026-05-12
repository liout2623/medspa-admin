<template>
  <div class="login-page">
    <div class="login-wrap card">
      <button
        class="theme-btn"
        :title="themeTitle"
        :aria-label="themeTitle"
        @click="ui.toggleTheme()"
      >
        <Moon v-if="ui.themeMode === 'light'" :size="16" />
        <Sun v-else :size="16" />
      </button>
      <div class="login-head">
        <div class="icon-wrap">🏥</div>
        <h3>{{ isLoginMode ? '医馆管理系统' : '注册新账号' }}</h3>
      </div>

      <form v-if="isLoginMode" class="login-body" @submit.prevent="onLogin">
        <div class="form-item">
          <label>用户名</label>
          <input v-model.trim="loginForm.username" class="input" required />
        </div>
        <div class="form-item">
          <label>密码</label>
          <input v-model="loginForm.password" type="password" class="input" required />
        </div>

        <button class="btn btn-primary btn-block" :disabled="loading">
          {{ loading ? '登录中...' : '登录' }}
        </button>
        <p v-if="err" class="err-text">{{ err }}</p>
        <div class="toggle-link" @click="toggleMode">没有账号？去注册</div>
      </form>

      <form v-else class="login-body register-body" @submit.prevent="onRegister">
        <div class="form-item">
          <label>用户名 <span class="req">*</span></label>
          <input v-model.trim="regForm.username" class="input" required />
        </div>
        <div class="form-item">
          <label>密码 <span class="req">*</span></label>
          <input v-model="regForm.password" type="password" class="input" required />
        </div>
        <div class="form-item">
          <label>确认密码 <span class="req">*</span></label>
          <input v-model="regForm.confirmPassword" type="password" class="input" required />
        </div>
        <div class="form-item">
          <label>验证码 <span class="req">*</span></label>
          <div class="captcha-row">
            <input v-model.trim="regForm.captchaCode" class="input captcha-input" placeholder="请输入验证码" required />
            <div class="captcha-img-wrap" @click="refreshCaptcha" :title="captchaLoading ? '加载中...' : '点击刷新验证码'">
              <img v-if="captchaImage" :src="captchaImage" alt="验证码" class="captcha-img" />
              <span v-else class="captcha-placeholder">{{ captchaLoading ? '加载中...' : '点击刷新' }}</span>
            </div>
          </div>
        </div>
        <div class="form-item">
          <label>显示名 <span class="req">*</span></label>
          <input v-model.trim="regForm.displayName" class="input" required />
        </div>
        <div class="form-item">
          <label>手机号</label>
          <input v-model.trim="regForm.phone" class="input" />
        </div>
        <div class="form-item">
          <label>职务/职业</label>
          <input v-model.trim="regForm.occupation" class="input" />
        </div>

        <button class="btn btn-primary btn-block" :disabled="loading">
          {{ loading ? '提交中...' : '立即注册' }}
        </button>
        <p v-if="err" class="err-text">{{ err }}</p>
        <div class="toggle-link" @click="toggleMode">已有账号？去登录</div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import { useUiStore } from '../../stores/ui'
import { getCaptcha, register } from '../../api/auth'
import { Sun, Moon } from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const ui = useUiStore()

const isLoginMode = ref(true)
const loading = ref(false)
const err = ref('')
const themeTitle = computed(() => ui.themeMode === 'light' ? '切换至深色模式' : '切换至浅色模式')

const loginForm = reactive({ username: '', password: '' })

// 验证码相关状态
const captchaId = ref('')
const captchaImage = ref('')
const captchaLoading = ref(false)

const refreshCaptcha = async () => {
  captchaLoading.value = true
  captchaImage.value = ''
  try {
    const res = await getCaptcha()
    captchaId.value = res.data.data.captchaId
    captchaImage.value = res.data.data.imageBase64
  } catch {
    captchaId.value = ''
    captchaImage.value = ''
  } finally {
    captchaLoading.value = false
  }
}

// 切换到注册模式时自动加载验证码
watch(isLoginMode, (val) => {
  if (!val) {
    refreshCaptcha()
  }
})

// 自动填入从修改密码页面传来的用户名
onMounted(() => {
  const { username } = route.query
  if (username && typeof username === 'string') {
    loginForm.username = username
  }
})

const regForm = reactive({ username: '', password: '', confirmPassword: '', displayName: '', phone: '', occupation: '', captchaCode: '' })

const toggleMode = () => {
  isLoginMode.value = !isLoginMode.value
  err.value = ''
}

const onLogin = async () => {
  err.value = ''
  if (!loginForm.username || !loginForm.password) {
    err.value = '请输入用户名和密码'
    return
  }
  try {
    loading.value = true
    await auth.doLogin(loginForm)
    ui.toast('登录成功', 'success')
    router.push('/customers')
  } catch (e: any) {
    err.value = e?.response?.data?.message || '登录失败'
  } finally {
    loading.value = false
  }
}

const onRegister = async () => {
  err.value = ''
  if (!regForm.username || !regForm.password || !regForm.displayName) {
    err.value = '请完整填写必填字段'
    return
  }
  if (regForm.password !== regForm.confirmPassword) {
    err.value = '两次输入的密码不一致，请检查'
    return
  }
  if (!captchaId.value) {
    err.value = '验证码标识不能为空，请刷新验证码'
    refreshCaptcha()
    return
  }
  if (!regForm.captchaCode) {
    err.value = '验证码不能为空'
    return
  }
  try {
    loading.value = true
    await register({
      username: regForm.username,
      password: regForm.password,
      displayName: regForm.displayName,
      phone: regForm.phone,
      occupation: regForm.occupation,
      captchaId: captchaId.value,
      captchaCode: regForm.captchaCode
    })
    ui.toast('注册成功，请使用新账号登录', 'success')
    loginForm.username = regForm.username
    loginForm.password = ''
    regForm.captchaCode = ''
    toggleMode()
  } catch (e: any) {
    const status = e?.response?.status
    const errorMsg = e?.response?.data?.message || '注册失败，请检查网络或稍后重试'
    err.value = errorMsg
    ui.toast(errorMsg, 'error')
    // 验证码错误或429频率限制时自动刷新验证码
    if (status === 400 || status === 429) {
      regForm.captchaCode = ''
      refreshCaptcha()
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page{min-height:100vh;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,var(--login-bg-start) 0%,var(--login-bg-mid) 55%,var(--login-bg-end) 100%);padding:20px;transition:background-color .3s ease,color .3s ease}
.login-wrap{position:relative;width:380px;max-height:90vh;display:flex;flex-direction:column;overflow:hidden;border-radius:16px;background:var(--bg-panel);box-shadow:var(--shadow-lg);border:1px solid var(--border)}
.theme-btn{position:absolute;right:12px;top:12px;width:34px;height:34px;border-radius:10px;border:1px solid var(--border);background:var(--bg-subtle);color:var(--text-muted);display:inline-flex;align-items:center;justify-content:center;cursor:pointer;z-index:2;transition:all .2s ease}
.theme-btn:hover{color:var(--brand);border-color:var(--brand);box-shadow:0 8px 18px rgba(15,118,110,.18)}
.login-head{padding:28px;color:#fff;background:linear-gradient(135deg,var(--brand),var(--brand-end));text-align:center;flex-shrink:0}
.login-body{padding:24px;overflow-y:auto}
.icon-wrap{font-size:30px}
.form-item { margin-bottom: 14px; }
.form-item label { display: block; margin-bottom: 6px; font-size: 13px; color: var(--text-muted); font-weight:500; }
.req { color: var(--danger); margin-left:2px; }
.err-text { color: var(--toast-error); font-size: 12px; margin-top: 8px; }
.btn-block { width: 100%; margin-top: 8px; }
.toggle-link {
  margin-top: 18px;
  text-align: center;
  font-size: 13px;
  color: var(--brand);
  cursor: pointer;
  transition: opacity 0.2s;
}
.toggle-link:hover {
  opacity: 0.8;
  text-decoration: underline;
}
.register-body::-webkit-scrollbar { width: 5px; }
.register-body::-webkit-scrollbar-thumb { background: var(--border-strong); border-radius: 10px; }
.captcha-row { display: flex; align-items: center; gap: 10px; }
.captcha-input { flex: 1; min-width: 0; }
.captcha-img-wrap {
  flex-shrink: 0;
  width: 110px;
  height: 38px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--bg-subtle);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  overflow: hidden;
  transition: border-color .2s ease, box-shadow .2s ease;
}
.captcha-img-wrap:hover {
  border-color: var(--brand);
  box-shadow: 0 2px 8px rgba(15,118,110,.15);
}
.captcha-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.captcha-placeholder {
  font-size: 12px;
  color: var(--text-muted);
  white-space: nowrap;
}
</style>

<style>
html.dark .login-head {
  background: linear-gradient(135deg, rgba(15, 118, 110, 0.95), rgba(20, 184, 166, 0.9));
}
</style>
