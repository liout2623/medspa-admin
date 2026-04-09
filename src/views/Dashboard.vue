<template>
  <el-container style="height:100vh">
    <el-header style="display:flex;justify-content:space-between;align-items:center">
      <div>医馆管理系统</div>
      <div>
        <span style="margin-right:12px">{{ auth.user?.displayName || auth.user?.username }}</span>
        <el-button size="small" @click="logout">退出</el-button>
      </div>
    </el-header>
    <el-main>
      <el-menu mode="horizontal" :default-active="activePath" @select="onSelect">
        <el-menu-item index="/users">用户管理</el-menu-item>
        <el-menu-item index="/customers">客户管理</el-menu-item>
      </el-menu>
      <div style="margin-top:16px">
        <router-view />
      </div>
    </el-main>
  </el-container>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const activePath = computed(() => route.path)

const onSelect = (index: string) => router.push(index)
const logout = () => {
  auth.logout()
  router.push('/login')
}
</script>