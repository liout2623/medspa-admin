<template>
  <div>
    <header class="app-nav">
      <div>医馆管理系统</div>
      <div>
        <button class="tab" :class="{a:route.path==='/users'}" @click="go('/users')">用户管理</button>
        <button class="tab" :class="{a:route.path==='/customers'}" @click="go('/customers')">客户管理</button>
      </div>
      <div>
        <span style="margin-right:8px">{{ auth.user?.displayName || auth.user?.username }}</span>
        <button class="btn-logout" @click="logout">退出</button>
      </div>
    </header>
    <main class="container" style="padding-top:80px"><router-view /></main>
  </div>
</template>

<script setup lang="ts">
import { useRoute,useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
const route=useRoute(); const router=useRouter(); const auth=useAuthStore()
const go=(p:string)=>router.push(p)
const logout=()=>{auth.logout();router.push('/login')}
</script>

<style scoped>
.app-nav{position:fixed;left:0;right:0;top:0;height:62px;background:linear-gradient(135deg,#134e4a 0%,#0d9488 60%,#0891b2 100%);display:flex;align-items:center;justify-content:space-between;padding:0 20px;color:#fff}
.tab{background:transparent;border:none;color:#d1fae5;margin:0 6px;cursor:pointer}
.tab.a{color:#fff;font-weight:700}
.btn-logout{background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.35);color:#fff;border-radius:8px;padding:4px 10px}
</style>