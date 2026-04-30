<template>
  <section class="customer-detail-page">
    <template v-if="loading">
      <div class="card header-card">
        <div class="skeleton-line short" />
        <div class="skeleton-line long" />
        <div class="skeleton-actions">
          <div class="skeleton-pill" />
          <div class="skeleton-pill" />
        </div>
      </div>
      <div class="card content-card">
        <div class="skeleton-block" />
        <div class="skeleton-grid">
          <div v-for="i in 8" :key="i" class="skeleton-row" />
        </div>
      </div>
    </template>

    <template v-else-if="notFound">
      <div class="card empty-state">
        <div class="empty-icon">🙈</div>
        <h3>客户不存在</h3>
        <p>请检查链接是否正确，或返回客户列表继续查找。</p>
        <div class="state-actions">
          <button class="btn btn-ghost" @click="goBack">返回客户列表</button>
        </div>
      </div>
    </template>

    <template v-else-if="errorMessage">
      <div class="card empty-state error-state">
        <div class="empty-icon">⚠️</div>
        <h3>加载失败</h3>
        <p>{{ errorMessage }}</p>
        <div class="state-actions">
          <button class="btn btn-ghost" @click="goBack">返回客户列表</button>
          <button class="btn btn-primary" @click="loadCustomer">重试</button>
        </div>
      </div>
    </template>

    <template v-else-if="customer">
      <header class="card header-card">
        <div class="header-main">
          <button class="back-btn" @click="goBack">
            <ArrowLeft :size="16" />
            返回客户列表
          </button>
          <div class="title-group">
            <h1>{{ displayValue(customer.name) }}</h1>
          </div>
        </div>
        <div class="header-actions">
          <button class="btn btn-ghost" :disabled="copying" @click="copyPrimaryInfo">
            <Copy :size="16" />
            {{ copying ? '复制中...' : '复制主要信息' }}
          </button>
          <button class="btn btn-primary" @click="handleEdit">
            <Edit2 :size="16" />
            编辑客户
          </button>
        </div>
      </header>

      <article class="card info-card">
        <div class="section-head">
          <h2>基本信息</h2>
        </div>
        <dl class="info-list">
          <div class="info-row">
            <dt>ID</dt>
            <dd>{{ displayValue(customer.id) }}</dd>
          </div>
          <div class="info-row">
            <dt>姓名</dt>
            <dd>{{ displayValue(customer.name) }}</dd>
          </div>
          <div class="info-row">
            <dt>手机号</dt>
            <dd>{{ displayValue(customer.phone) }}</dd>
          </div>
          <div class="info-row">
            <dt>邮箱</dt>
            <dd>{{ displayValue(customer.email) }}</dd>
          </div>
          <div class="info-row">
            <dt>性别</dt>
            <dd>{{ displayValue(customer.gender) }}</dd>
          </div>
          <div class="info-row">
            <dt>生日</dt>
            <dd>{{ formatBirthday(customer.birthday) }}</dd>
          </div>
          <div class="info-row tags-row">
            <dt>标签</dt>
            <dd>
              <div v-if="tagList.length" class="tag-list">
                <span v-for="tag in tagList" :key="tag" class="tag-chip">{{ tag }}</span>
              </div>
              <span v-else class="placeholder">—</span>
            </dd>
          </div>
          <div class="info-row note-row">
            <dt>备注</dt>
            <dd>
              <p v-if="displayValue(customer.note) !== '—'" class="note-text">{{ customer.note }}</p>
              <span v-else class="placeholder">—</span>
            </dd>
          </div>
        </dl>
      </article>

      <article class="card info-card secondary-card">
        <div class="section-head">
          <h2>时间信息</h2>
        </div>
        <dl class="info-list secondary-list">
          <div class="info-row">
            <dt>创建时间</dt>
            <dd>{{ formatDateTime(customer.createdAt) }}</dd>
          </div>
          <div class="info-row">
            <dt>更新时间</dt>
            <dd>{{ formatDateTime(customer.updatedAt) }}</dd>
          </div>
        </dl>
      </article>

      <HealthRecordPanel :customerId="Number(route.params.id)" />
    </template>
  </section>

  <CustomerFormModal
    v-model:visible="formVisible"
    :editingCustomer="customer"
    @saved="handleSaved"
  />
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Copy, Edit2 } from 'lucide-vue-next'
import { getCustomer } from '../../api/customer'
import CustomerFormModal from '../../components/customer/CustomerFormModal.vue'
import HealthRecordPanel from '../../components/customer/HealthRecordPanel.vue'
import { useUiStore } from '../../stores/ui'
import type { CustomerResponse } from '../../types/customer'

const route = useRoute()
const router = useRouter()
const ui = useUiStore()

const loading = ref(false)
const copying = ref(false)
const notFound = ref(false)
const errorMessage = ref('')
const customer = ref<CustomerResponse | null>(null)
const formVisible = ref(false)

const displayValue = (value: unknown) => {
  if (value === null || value === undefined) return '—'
  const text = String(value).trim()
  return text ? text : '—'
}

const pad2 = (value: number) => String(value).padStart(2, '0')

const formatBirthday = (value?: string) => {
  if (!value) return '—'
  const text = String(value).trim()
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (match) return `${match[1]}-${match[2]}-${match[3]}`
  const date = new Date(text)
  if (Number.isNaN(date.getTime())) return text || '—'
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`
}

const formatDateTime = (value?: string) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value || '—'
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())} ${pad2(date.getHours())}:${pad2(date.getMinutes())}`
}

const tagList = computed(() => {
  const raw = customer.value?.tags || ''
  return raw
    .split(/[,，]/)
    .map((tag) => tag.trim())
    .filter(Boolean)
})

const getId = () => Number(route.params.id)

const loadCustomer = async () => {
  const id = getId()
  if (!Number.isFinite(id) || id <= 0) {
    notFound.value = true
    errorMessage.value = ''
    customer.value = null
    return
  }

  loading.value = true
  notFound.value = false
  errorMessage.value = ''

  try {
    const res = await getCustomer(id)
    const data = res.data.data
    if (!data) {
      notFound.value = true
      customer.value = null
      return
    }
    customer.value = data
  } catch (e: any) {
    const status = e?.response?.status
    if (status === 404) {
      notFound.value = true
      customer.value = null
      return
    }
    const message = e?.response?.data?.message || e?.message || '加载客户详情失败'
    errorMessage.value = message
    ui.toast(message, 'error')
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  if (window.history.length > 1) {
    router.back()
    return
  }
  router.push({ name: 'customers' })
}

const copyPrimaryInfo = async () => {
  if (!customer.value) return
  const lines = [
    `ID：${displayValue(customer.value.id)}`,
    `姓名：${displayValue(customer.value.name)}`,
    `手机号：${displayValue(customer.value.phone)}`,
    `邮箱：${displayValue(customer.value.email)}`,
    `性别：${displayValue(customer.value.gender)}`,
    `生日：${formatBirthday(customer.value.birthday)}`,
    `标签：${tagList.value.length ? tagList.value.join('、') : '—'}`,
    `备注：${displayValue(customer.value.note)}`,
    `创建时间：${formatDateTime(customer.value.createdAt)}`,
    `更新时间：${formatDateTime(customer.value.updatedAt)}`
  ]
  const text = lines.join('\n')
  try {
    copying.value = true
    await navigator.clipboard.writeText(text)
    ui.toast('主要信息已复制', 'success')
  } catch {
    ui.toast('复制失败，请手动复制', 'error')
  } finally {
    copying.value = false
  }
}

const handleEdit = () => {
  if (!customer.value) return
  formVisible.value = true
}

const handleSaved = async () => {
  await loadCustomer()
}

watch(
  () => route.params.id,
  () => {
    void loadCustomer()
  },
  { immediate: true }
)
</script>

<style scoped>
.customer-detail-page {
  display: grid;
  gap: 16px;
}

.header-card,
.info-card,
.placeholder-card,
.empty-state {
  padding: 18px;
}

.header-card {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.header-main {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  min-width: 0;
}

.back-btn {
  border: 1px solid var(--border);
  background: var(--bg-subtle);
  color: var(--text-strong);
  border-radius: 999px;
  padding: 8px 14px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
}

.back-btn:hover {
  background: var(--bg-hover);
}

.title-group {
  min-width: 0;
}

.title-group h1 {
  margin: 0;
  font-size: 28px;
  line-height: 1.2;
  color: var(--text-strong);
  font-weight: 800;
  word-break: break-word;
}

.title-group p {
  margin: 8px 0 0;
  color: var(--text-muted);
  font-size: 13px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.section-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 16px;
}

.section-head h2 {
  margin: 0;
  font-size: 17px;
  color: var(--text-strong);
}

.section-tip {
  color: var(--text-muted);
  font-size: 12px;
}

.info-list {
  display: grid;
  gap: 12px;
}

.info-row {
  display: grid;
  grid-template-columns: 120px minmax(0, 1fr);
  gap: 14px;
  align-items: start;
  padding: 12px 0;
  border-bottom: 1px solid var(--border-soft, var(--border));
}

.info-row:last-child {
  border-bottom: 0;
  padding-bottom: 0;
}

.info-row dt {
  color: var(--text-muted);
  font-size: 13px;
}

.info-row dd {
  margin: 0;
  color: var(--text-strong);
  min-width: 0;
  word-break: break-word;
}

.placeholder {
  color: var(--text-muted);
}

.tag-list {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.tag-chip {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid rgba(15, 118, 110, 0.18);
  background: rgba(15, 118, 110, 0.08);
  color: var(--brand-dark);
  font-size: 12px;
}

.note-text {
  margin: 0;
  white-space: pre-wrap;
  line-height: 1.7;
}

.secondary-list .info-row {
  grid-template-columns: 140px minmax(0, 1fr);
}

.placeholder-card {
  min-height: 180px;
}

.placeholder-box {
  min-height: 120px;
  border: 1px dashed var(--border);
  border-radius: 14px;
  background: var(--bg-subtle);
  display: grid;
  place-items: center;
  text-align: center;
  padding: 20px;
}

.placeholder-box h3 {
  margin: 0 0 8px;
  font-size: 18px;
  color: var(--text-strong);
}

.placeholder-box p {
  margin: 0;
  color: var(--text-muted);
}

.empty-state {
  min-height: 320px;
  display: grid;
  place-items: center;
  text-align: center;
}

.empty-icon {
  font-size: 34px;
  margin-bottom: 10px;
}

.empty-state h3 {
  margin: 0;
  font-size: 22px;
  color: var(--text-strong);
}

.empty-state p {
  margin: 10px 0 0;
  color: var(--text-muted);
}

.state-actions {
  margin-top: 18px;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: center;
}

.skeleton-line,
.skeleton-pill,
.skeleton-row,
.skeleton-block {
  border-radius: 10px;
  background: linear-gradient(90deg, rgba(148, 163, 184, 0.14) 25%, rgba(148, 163, 184, 0.24) 50%, rgba(148, 163, 184, 0.14) 75%);
  background-size: 240% 100%;
  animation: shimmer 1.2s infinite linear;
}

.skeleton-line.short {
  width: 180px;
  height: 18px;
  margin-bottom: 12px;
}

.skeleton-line.long {
  width: min(520px, 100%);
  height: 34px;
}

.skeleton-actions {
  display: flex;
  gap: 10px;
  margin-top: 14px;
}

.skeleton-pill {
  width: 120px;
  height: 36px;
}

.skeleton-block {
  width: 180px;
  height: 18px;
  margin-bottom: 18px;
}

.skeleton-grid {
  display: grid;
  gap: 12px;
}

.skeleton-row {
  height: 48px;
}

@keyframes shimmer {
  0% { background-position: 100% 0; }
  100% { background-position: -100% 0; }
}

@media (max-width: 840px) {
  .header-card {
    flex-direction: column;
  }

  .header-main {
    flex-direction: column;
  }

  .header-actions {
    justify-content: flex-start;
  }

  .info-row,
  .secondary-list .info-row {
    grid-template-columns: 1fr;
    gap: 6px;
  }
}

html.dark .tag-chip {
  border-color: rgba(20, 184, 166, 0.3);
  background: rgba(20, 184, 166, 0.14);
  color: #7de6d8;
}

html.dark .back-btn {
  background: rgba(15, 23, 42, 0.82);
}

html.dark .placeholder-box {
  background: rgba(15, 23, 42, 0.58);
}
</style>
