<template>
  <div>
    <header class="app-nav">
      <a class="brand" href="javascript:void(0)">🏥 医馆管理系统</a>
      <ul class="nav-tabs-bar">
        <li><button class="tab-btn" :class="{active: activePath==='/users'}" @click="go('/users')">用户管理</button></li>
        <li><button class="tab-btn" :class="{active: activePath==='/customers'}" @click="go('/customers')">客户管理</button></li>
      </ul>
      <div class="nav-right">
        <div class="user-info">
          <div class="user-avatar">👤</div>
          <span>{{ auth.user?.displayName || auth.user?.username || '未登录' }}</span>
        </div>
        <button class="btn-logout" @click="logout">退出</button>
      </div>
    </header>

    <div class="page container">
      <router-view />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const activePath = computed(() => route.path)

const go = (path: string) => router.push(path)
const logout = () => {
  auth.logout()
  router.push('/login')
}
</script>

<style scoped>
.app-nav {
  position: fixed; top: 0; left: 0; right: 0; z-index: 1000;
  height: 62px;
  background: linear-gradient(135deg, #134e4a 0%, #0d9488 60%, #0891b2 100%);
  display: flex; align-items: center; padding: 0 28px;
  box-shadow: 0 2px 12px rgba(0,0,0,.18);
}
.brand {
  color: #fff; font-size: 1.1rem; font-weight: 700;
}
.nav-tabs-bar {
  display: flex; gap: 6px; margin-left: 24px; list-style: none; padding: 0;
}
.tab-btn {
  border: none; cursor: pointer; border-radius: 8px; padding: 6px 16px;
  background: transparent; color: rgba(255,255,255,.75);
}
.tab-btn:hover, .tab-btn.active { background: rgba(255,255,255,.2); color: #fff; }

.nav-right { margin-left: auto; display: flex; align-items: center; gap: 12px; color: #fff; }
.user-info { display: flex; align-items: center; gap: 8px; }
.user-avatar {
  width: 32px; height: 32px; border-radius: 50%;
  background: rgba(255,255,255,.22); display: flex; align-items: center; justify-content: center;
}
.btn-logout {
  background: rgba(255,255,255,.14); border: 1px solid rgba(255,255,255,.3);
  color: #fff; border-radius: 8px; padding: 5px 14px; cursor: pointer;
}
.page { padding-top: 78px; padding-bottom: 48px; }
</style>