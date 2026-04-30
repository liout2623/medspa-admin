<template>
  <section class="settings-page">
    <article class="card settings-card">
      <h3>密码修改</h3>
      <p class="desc">为了账号安全，请定期更新密码。</p>
      <form class="form" @submit.prevent="onChangePassword">
        <label>当前密码</label>
        <input v-model="passwordForm.currentPassword" type="password" class="input" autocomplete="current-password" />

        <label>新密码</label>
        <input v-model="passwordForm.newPassword" type="password" class="input" autocomplete="new-password" />

        <label>确认新密码</label>
        <input v-model="passwordForm.confirmPassword" type="password" class="input" autocomplete="new-password" />

        <button class="btn btn-primary" :disabled="changingPassword">
          {{ changingPassword ? '提交中...' : '更新密码' }}
        </button>
      </form>
    </article>

    <article class="card settings-card">
      <h3>外观偏好</h3>
      <p class="desc">切换浅色或深色模式，界面会立即同步到全局。</p>
      <div class="appearance-switch">
        <button
          class="appearance-option"
          :class="{ active: ui.themeMode === 'light' }"
          @click="ui.setTheme('light')"
        >
          <Sun :size="16" />
          <span>浅色模式</span>
        </button>
        <button
          class="appearance-option"
          :class="{ active: ui.themeMode === 'dark' }"
          @click="ui.setTheme('dark')"
        >
          <Moon :size="16" />
          <span>深色模式</span>
        </button>
      </div>
    </article>

    <article class="card settings-card danger-card">
      <h3>危险操作</h3>
      <p class="desc">注销账号后将无法恢复，请谨慎操作。</p>
      <button class="btn-danger" :disabled="deletingAccount" @click="onDeleteAccount">
        {{ deletingAccount ? '处理中...' : '注销账号' }}
      </button>
    </article>
  </section>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUiStore } from '../../stores/ui'
import { useAuthStore } from '../../stores/auth'
import { changePassword, deleteCurrentAccount } from '../../api/auth'
import { Sun, Moon } from 'lucide-vue-next'

const router = useRouter()
const ui = useUiStore()
const auth = useAuthStore()

const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const changingPassword = ref(false)
const deletingAccount = ref(false)

const parseErr = (e: any, fallback: string) => {
  if (e?.response?.status === 403) return '无权限执行该操作'
  return e?.response?.data?.message || fallback
}

const resetPasswordForm = () => {
  passwordForm.currentPassword = ''
  passwordForm.newPassword = ''
  passwordForm.confirmPassword = ''
}

const onChangePassword = async () => {
  if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
    ui.toast('请完整填写密码字段', 'error')
    return
  }
  if (passwordForm.newPassword.length < 6) {
    ui.toast('新密码长度至少 6 位', 'error')
    return
  }
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    ui.toast('两次新密码输入不一致', 'error')
    return
  }

  try {
    changingPassword.value = true
    await changePassword({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword
    })
    resetPasswordForm()
    ui.toast('密码修改成功', 'success')
    // 密码修改成功后，跳转到登录页并填入用户名
    const username = auth.user?.username || ''
    auth.logout()
    setTimeout(() => {
      router.push({ path: '/login', query: { username } })
    }, 800)
  } catch (e: any) {
    ui.toast(parseErr(e, '修改失败，请稍后重试'), 'error')
  } finally {
    changingPassword.value = false
  }
}

const onDeleteAccount = async () => {
  const firstConfirm = await ui.confirm('确认注销账号', '该操作不可逆，确认要继续吗？')
  if (!firstConfirm) return

  const secondConfirm = await ui.confirm('二次确认', '请再次确认注销账号，注销后将立即退出系统。')
  if (!secondConfirm) return

  try {
    deletingAccount.value = true
    await deleteCurrentAccount()
    auth.logout()
    ui.toast('账号已注销', 'success')
    router.push('/login')
  } catch (e: any) {
    ui.toast(parseErr(e, '注销失败，请稍后重试'), 'error')
  } finally {
    deletingAccount.value = false
  }
}
</script>

<style scoped>
.settings-page {
  display: grid;
  grid-template-columns: repeat(3, minmax(260px, 1fr));
  gap: 16px;
}

.settings-card {
  padding: 18px;
}

h3 {
  margin: 0;
  font-size: 18px;
  color: var(--text-strong);
}

.desc {
  margin: 8px 0 14px;
  color: var(--text-muted);
  font-size: 13px;
}

.form {
  display: grid;
  gap: 10px;
}

.form label {
  color: var(--text);
  font-size: 13px;
}

.appearance-switch {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.appearance-option {
  border: 1px solid var(--border);
  background: var(--bg-subtle);
  color: var(--text-muted);
  border-radius: 12px;
  padding: 12px 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.appearance-option.active {
  color: #fff;
  background: linear-gradient(135deg, var(--brand), var(--brand-end));
  border-color: transparent;
  box-shadow: 0 8px 18px rgba(15, 118, 110, 0.18);
}

.danger-card {
  border-color: rgba(244, 63, 94, 0.28);
  background: linear-gradient(180deg, var(--bg-panel), rgba(244, 63, 94, 0.04));
}

.btn-danger {
  border: 1px solid rgba(244, 63, 94, 0.3);
  background: rgba(244, 63, 94, 0.08);
  color: #be123c;
  border-radius: 10px;
  padding: 10px 14px;
  cursor: pointer;
  font-weight: 600;
}

.btn-danger:hover:not(:disabled) {
  background: rgba(244, 63, 94, 0.14);
}

.btn-danger:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 980px) {
  .settings-page {
    grid-template-columns: 1fr;
  }
}

html.dark .danger-card {
  background: linear-gradient(180deg, var(--bg-panel), rgba(244, 63, 94, 0.06));
}
</style>
