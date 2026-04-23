<template>
  <div class="login-page">
    <div class="login-wrap card">
      <div class="login-head">
        <div class="icon-wrap">🏥</div>
        <h3>{{ isLoginMode ? '医馆管理系统' : '注册新账号' }}</h3>
      </div>
      
      <!-- 登录表单 -->
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
        <p v-if="err" class="err-text" style="color:#dc2626;font-size:12px;margin-top:8px;">{{ err }}</p>
        <div class="toggle-link" @click="toggleMode">没有账号？去注册</div>
      </form>

      <!-- 注册表单 -->
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
          <label>显示名 <span class="req">*</span></label>
          <input v-model.trim="regForm.displayName" type="password" class="input" required />
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
        <p v-if="err" class="err-text" style="color:#dc2626;font-size:12px;margin-top:8px;">{{ err }}</p>
        <div class="toggle-link" @click="toggleMode">已有账号？去登录</div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useUiStore } from '../stores/ui'
import { register } from '../api/auth'

const router = useRouter()
const auth = useAuthStore()
const ui = useUiStore()

const isLoginMode = ref(true)
const loading = ref(false)
const err = ref('')

const loginForm = reactive({ username: '', password: '' })
const regForm = reactive({ username: '', password: '', confirmPassword: '', displayName: '', phone: '', occupation: '' })

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
    router.push('/users')
  } catch (e: any) {
    err.value = e?.response?.data?.message || '登录失败'
  } finally {
    loading.value = false
  }
}

const onRegister = async () => {
  err.value = ''
  if (!regForm.username || !regForm.password) {
    err.value = '请填写用户名和密码'
    return
  }
  if (regForm.password !== regForm.confirmPassword) {
    err.value = '两次输入的密码不一致，请检查'
    return
  }
  try {
    loading.value = true
    await register({
      username: regForm.username,
      password: regForm.password,
      displayName: regForm.displayName,
      phone: regForm.phone,
      occupation: regForm.occupation
    })
    ui.toast('注册成功，请使用新账号登录', 'success')
    // 将填写的用户名带入登录表单，并清空密码
    loginForm.username = regForm.username
    loginForm.password = ''
    toggleMode()
  } catch (e: any) {
    const errorMsg = e?.response?.data?.message || '注册失败，请检查网络或稍后重试'
    err.value = errorMsg
    ui.toast(errorMsg, 'error')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page{min-height:100vh;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#134e4a 0%,#0d9488 55%,#0891b2 100%);padding:20px}
.login-wrap{width:380px;max-height:90vh;display:flex;flex-direction:column;overflow:hidden;border-radius:12px;background:#fff;box-shadow:0 10px 25px rgba(0,0,0,.15)}
.login-head{padding:28px;color:#fff;background:linear-gradient(135deg,var(--brand),var(--brand-end));text-align:center;flex-shrink:0}
.login-body{padding:24px;overflow-y:auto}
.icon-wrap{font-size:30px}

.form-item { margin-bottom: 14px; }
.form-item label { display: block; margin-bottom: 6px; font-size: 13px; color: #475569; font-weight:500; }
.req { color: #e11d48; margin-left:2px; }

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

/* 兼容滚动条 */
.register-body::-webkit-scrollbar { width: 5px; }
.register-body::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
</style>