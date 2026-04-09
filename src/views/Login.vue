<template>
  <div class="login-page">
    <div class="login-wrap card">
      <div class="login-head">
        <div class="icon-wrap">🏥</div>
        <h3>医馆管理系统</h3>
      </div>
      <form class="login-body" @submit.prevent="onSubmit">
        <label>用户名</label>
        <input v-model.trim="form.username" class="input" />
        <label style="margin-top:10px;display:block">密码</label>
        <input v-model="form.password" type="password" class="input" />
        <button class="btn btn-primary" style="width:100%;margin-top:12px" :disabled="loading">
          {{ loading ? '登录中...' : '登录' }}
        </button>
        <p v-if="err" style="color:#dc2626;font-size:12px">{{ err }}</p>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
const router = useRouter()
const auth = useAuthStore()
const loading = ref(false)
const err = ref('')
const form = reactive({ username: '', password: '' })
const onSubmit = async () => {
  err.value = ''
  try {
    loading.value = true
    await auth.doLogin(form)
    router.push('/users')
  } catch (e: any) {
    err.value = e?.response?.data?.message || '登录失败'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page{min-height:100vh;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#134e4a 0%,#0d9488 55%,#0891b2 100%)}
.login-wrap{width:380px;overflow:hidden}
.login-head{padding:28px;color:#fff;background:linear-gradient(135deg,var(--brand),var(--brand-end));text-align:center}
.login-body{padding:20px}
.icon-wrap{font-size:30px}
</style>