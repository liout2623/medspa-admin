<template>
  <div class="detail-page">
    <!-- Page header -->
    <div class="detail-header">
      <button class="btn btn-ghost" @click="router.back()">
        <ArrowLeft :size="16" />
        返回
      </button>
      <h2 class="detail-title">客户详情</h2>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="state-hint">加载中...</div>

    <!-- Not found state -->
    <div v-else-if="!customer" class="state-hint">客户不存在或已被删除。</div>

    <template v-else>
      <!-- Basic info card -->
      <div class="card panel info-card">
        <h3 class="section-title">基本信息</h3>
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">ID</span>
            <span class="info-value">{{ customer.id }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">姓名</span>
            <span class="info-value">{{ customer.name }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">手机号</span>
            <span class="info-value">{{ customer.phone || '-' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">邮箱</span>
            <span class="info-value">{{ customer.email || '-' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">性别</span>
            <span class="info-value">{{ customer.gender || '-' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">生日</span>
            <span class="info-value">{{ customer.birthday || '-' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">标签</span>
            <span class="info-value">{{ customer.tags || '-' }}</span>
          </div>
          <div class="info-item info-item-full">
            <span class="info-label">备注</span>
            <span class="info-value">{{ customer.note || '-' }}</span>
          </div>
        </div>
      </div>

      <!-- Time info card -->
      <div class="card panel info-card">
        <h3 class="section-title">时间信息</h3>
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">创建时间</span>
            <span class="info-value">{{ formatDatetime(customer.createdAt) }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">更新时间</span>
            <span class="info-value">{{ formatDatetime(customer.updatedAt) }}</span>
          </div>
        </div>
      </div>

      <!-- Health records card -->
      <div class="card panel info-card">
        <HealthRecordPanel :customer-id="customer.id" :current-user="currentUser" />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ArrowLeft } from 'lucide-vue-next'
import { useAuthStore } from '../../stores/auth'
import { useUiStore } from '../../stores/ui'
import { getCustomer } from '../../api/customer'
import type { CustomerResponse } from '../../types/customer'
import HealthRecordPanel from './HealthRecordPanel.vue'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const ui = useUiStore()

const currentUser = computed(() => auth.user)
const customerId = computed(() => Number(route.params.id))

const customer = ref<CustomerResponse | null>(null)
const loading = ref(false)

const parseErr = (e: any, fallback: string) => e?.response?.data?.message || fallback

const formatDatetime = (d?: string) => {
  if (!d) return '-'
  return d.replace('T', ' ').slice(0, 19)
}

const load = async () => {
  try {
    loading.value = true
    const res = await getCustomer(customerId.value)
    customer.value = res.data.data
  } catch (e: any) {
    ui.toast(parseErr(e, '加载客户详情失败'), 'error')
    customer.value = null
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.detail-page { display: flex; flex-direction: column; gap: 16px; }

.detail-header {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 4px;
}
.detail-title {
  font-size: 1.15rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.state-hint {
  padding: 60px 20px;
  text-align: center;
  color: #94a3b8;
  font-size: .9rem;
}

.info-card { padding: 18px 20px; }

.section-title {
  font-size: .95rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 14px;
  padding-bottom: 10px;
  border-bottom: 1px solid #f1f5f9;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 10px 20px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.info-item-full {
  grid-column: 1 / -1;
}

.info-label {
  font-size: .75rem;
  font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.info-value {
  font-size: .9rem;
  color: #334155;
}
</style>
