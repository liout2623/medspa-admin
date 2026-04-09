<template>
  <div class="login-page">
    <div class="login-wrap">
      <div class="login-card">
        <div class="login-head">
          <div class="icon-wrap">🏥</div>
          <h4>医馆管理系统</h4>
          <p>Medical Spa Management</p>
        </div>

        <div class="login-body">
          <form @submit.prevent="onSubmit">
            <div class="mb">
              <label class="label">用户名</label>
              <input v-model.trim="form.username" class="input" placeholder="请输入用户名" autocomplete="username" />
            </div>
            <div class="mb">
              <label class="label">密码</label>
              <input v-model="form.password" type="password" class="input" placeholder="请输入密码" autocomplete="current-password" />
            </div>
            <button class="btn btn-primary login-btn" :disabled="loading" type="submit">
              {{ loading ? '登录中…' : '登 录' }}
            </button>
          </form>
          <p class="foot">© 2026 医馆管理系统</p>
        </div>
      </div>
    </div>

    <div v-if="errorMsg" class="modal-mask" @click="errorMsg = ''">
      <div class="modal" @click.stop>
        <div class="emoji">⚠️</div>
        <h4>登录失败</h4>
        <p>{{ errorMsg }}</p>
        <button class="btn btn-primary" @click="errorMsg = ''">确定</button>
      </div>
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
const errorMsg = ref('')
const form = reactive({ username: '', password: '' })

const onSubmit = async () => {
  if (!form.username || !form.password) {
    errorMsg.value = '请输入用户名和密码。'
    return
  }
  try {
    loading.value = true
    await auth.doLogin(form)
    router.push('/users')
  } catch (e: any) {
    errorMsg.value = e?.response?.data?.message || '用户名或密码错误，请重试。'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #134e4a 0%, #0d9488 55%, #0891b2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}
.login-wrap { width: 100%; max-width: 420px; padding: 16px; }
.login-card {
  border-radius: 20px;
  box-shadow: 0 24px 60px rgba(0,0,0,.28);
  overflow: hidden;
  background: #fff;
}
.login-head {
  background: linear-gradient(135deg, var(--brand), var(--brand-end));
  padding: 40px 40px 30px;
  text-align: center;
  color: #fff;
}
.icon-wrap {
  width: 76px; height: 76px;
  border-radius: 50%;
  background: rgba(255,255,255,.18);
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 38px; margin-bottom: 14px;
}
.login-body { padding: 36px 40px 32px; }
.label { display: block; margin-bottom: 6px; font-size: .9rem; color: #374151; }
.mb { margin-bottom: 14px; }
.login-btn { width: 100%; margin-top: 4px; }
.foot { text-align: center; color: #9ca3af; font-size: .78rem; margin-top: 20px; }

.modal-mask {
  position: fixed; inset: 0; background: rgba(0,0,0,.35);
  display: flex; align-items: center; justify-content: center;
}
.modal {
  width: 320px; background: #fff; border-radius: 16px; padding: 20px; text-align: center;
}
.emoji { font-size: 2rem; margin-bottom: 6px; }
</style>