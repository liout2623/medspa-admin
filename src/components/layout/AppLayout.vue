<template>
  <div class="shell">
    <aside class="sidebar">
      <div class="brand">
        <div class="brand-icon-wrap">
          <Leaf :size="22" />
        </div>
        <div class="brand-title">医馆管理系统</div>
      </div>

      <nav class="menu">
        <RouterLink to="/customers" class="menu-item">
          <Users :size="18" />
          <span>客户管理</span>
        </RouterLink>
        <RouterLink v-if="isAdmin" to="/users" class="menu-item">
          <UserCog :size="18" />
          <span>用户管理</span>
        </RouterLink>
        <RouterLink to="/profile" class="menu-item">
          <Shield :size="18" />
          <span>个人设置</span>
        </RouterLink>
      </nav>
    </aside>

    <div class="workspace">
      <header class="topbar">
        <div class="title">{{ pageTitle }}</div>
        <div class="topbar-right">
          <div class="current-user">
            <span class="status-dot" />
            <span class="avatar">{{ userInitial }}</span>
            <span class="name">{{ currentUser?.displayName || currentUser?.username || '管理员' }}</span>
          </div>
          <button class="logout-btn" @click="handleLogout" title="退出登录">
            <LogOut :size="16" />
            <span>退出登录</span>
          </button>
        </div>
      </header>

      <main class="content">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import { useUiStore } from '../../stores/ui'
import {
  Leaf,
  Users,
  UserCog,
  Shield,
  LogOut
} from 'lucide-vue-next'

const auth = useAuthStore()
const ui = useUiStore()
const router = useRouter()
const route = useRoute()

const currentUser = computed(() => auth.user)

const pageTitle = computed(() => {
  return (route.meta.title as string) || '医馆管理系统'
})

const userInitial = computed(() => {
  const text = currentUser.value?.displayName || currentUser.value?.username || '管'
  return String(text).slice(0, 1).toUpperCase()
})

const isAdmin = computed(() => auth.user?.role === 'ADMIN')

const handleLogout = async () => {
  const ok = await ui.confirm('退出登录', '确认要退出登录吗？')
  if (!ok) return
  auth.logout()
  router.push('/login')
}
</script>

<style scoped>
.shell {
  display: flex;
  height: 100vh;
  background: #f3f7f7;
}

.sidebar {
  width: 240px;
  flex: 0 0 240px;
  background: linear-gradient(180deg, #0f5f5b 0%, #0f766e 100%);
  color: #e8fffb;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #0d5b55;
}

.brand {
  height: 86px;
  display: flex;
  align-items: center;
  padding: 0 18px;
  gap: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.14);
}

.brand-icon-wrap {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #0f766e;
  background: #e6fffb;
}

.brand-title {
  font-size: 20px;
  font-weight: 800;
  letter-spacing: 0.02em;
}

.menu {
  padding: 16px 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 12px;
  border-radius: 10px;
  color: #d7fff6;
  text-decoration: none;
  font-weight: 600;
  transition: all 0.2s ease;
  position: relative;
  border-left: 4px solid transparent;
}

.menu-item:hover {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.12);
}

.menu-item.router-link-active {
  color: #ffffff;
  background: rgba(224, 255, 247, 0.24);
  border-left-color: #8bf3df;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.14);
}

.workspace {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.topbar {
  height: 60px;
  flex: 0 0 60px;
  background: #ffffff;
  border-bottom: 1px solid #dce9e8;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
}

.title {
  color: #11413f;
  font-size: 18px;
  font-weight: 600;
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 14px;
}

.current-user {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #1f4f4a;
  font-weight: 500;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #14b8a6;
}

.avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #e6fffb;
  color: #0f766e;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
}

.name {
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.logout-btn {
  border: 0;
  border-radius: 10px;
  padding: 8px 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 7px;
  color: #ffffff;
  background: linear-gradient(135deg, #0f766e 0%, #14b8a6 100%);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.logout-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 18px rgba(20, 184, 166, 0.3);
}

.content {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 18px;
}

@media (max-width: 980px) {
  .sidebar {
    width: 208px;
    flex-basis: 208px;
  }
}

@media (max-width: 760px) {
  .sidebar {
    width: 76px;
    flex-basis: 76px;
  }

  .brand-title {
    display: none;
  }

  .menu-item {
    justify-content: center;
    padding: 10px 8px;
  }

  .menu-item span {
    display: none;
  }

  .title {
    font-size: 16px;
  }

  .logout-btn span {
    display: none;
  }

  .name {
    display: none;
  }
}
</style>
