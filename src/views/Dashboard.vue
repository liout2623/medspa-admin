<template>
  <section class="dashboard-page">
    <!-- Row 1: Today's Appointments (2 cols) + Today's Stats (1 col) -->
    <article class="card dash-card appointments-card">
      <header class="card-head">
        <div class="title-wrap">
          <Calendar :size="18" class="title-icon" />
          <h3>今日预约</h3>
        </div>
      </header>

      <!-- Loading -->
      <div v-if="aptLoading" class="skeleton-list" aria-label="loading">
        <div v-for="i in 3" :key="i" class="skeleton-item" />
      </div>

      <!-- Error -->
      <div v-else-if="aptError" class="empty-box">
        <AlertCircle :size="24" />
        <span>{{ aptError }}</span>
        <button class="btn btn-ghost retry-btn" @click="retryAppointments">重试</button>
      </div>

      <!-- Empty -->
      <div v-else-if="aptData.length === 0" class="empty-box">
        <CalendarX :size="24" />
        <span>今日暂无预约</span>
      </div>

      <!-- List -->
      <template v-else>
        <ul class="apt-list">
          <li v-for="apt in aptData.slice(0, 5)" :key="apt.id" class="apt-item">
            <span class="apt-time">{{ formatTime(apt.appointmentTime) }}</span>
            <span class="apt-name">{{ apt.customerName }}</span>
            <span class="apt-service">{{ apt.serviceName }}</span>
            <span :class="['status-badge', statusClass(apt.status)]">{{ statusLabel(apt.status) }}</span>
          </li>
        </ul>
        <div v-if="aptData.length > 5" class="card-footer-link">
          <router-link to="/appointments">查看全部（共 {{ aptData.length }} 条）</router-link>
        </div>
      </template>
    </article>

    <article class="card dash-card stats-card">
      <header class="card-head">
        <div class="title-wrap">
          <BarChart3 :size="18" class="title-icon" />
          <h3>今日概览</h3>
        </div>
      </header>

      <!-- Loading -->
      <div v-if="aptLoading" class="skeleton-list" aria-label="loading">
        <div v-for="i in 3" :key="i" class="skeleton-item" />
      </div>

      <!-- Error -->
      <div v-else-if="aptError" class="empty-box">
        <AlertCircle :size="24" />
        <span>{{ aptError }}</span>
      </div>

      <!-- Stats -->
      <div v-else class="stats-grid" :class="{ 'stats-dim': totalCount === 0 }">
        <div class="stat-item">
          <span class="stat-number">{{ totalCount || '-' }}</span>
          <span class="stat-label">预约总数</span>
        </div>
        <div class="stat-divider" />
        <div class="stat-item">
          <span class="stat-number stat-completed">{{ completedCount || '-' }}</span>
          <span class="stat-label">已完成</span>
        </div>
        <div class="stat-divider" />
        <div class="stat-item">
          <span class="stat-number stat-booked">{{ bookedCount || '-' }}</span>
          <span class="stat-label">待服务</span>
        </div>
      </div>
    </article>

    <!-- Row 2: Pending Appointments (1 col) + Recent Customers (1 col) + Birthday Card (1 col) -->
    <article class="card dash-card pending-card">
      <header class="card-head">
        <div class="title-wrap">
          <Clock :size="18" class="title-icon" />
          <h3>待服务预约</h3>
        </div>
      </header>

      <!-- Loading -->
      <div v-if="aptLoading" class="skeleton-list" aria-label="loading">
        <div v-for="i in 3" :key="i" class="skeleton-item" />
      </div>

      <!-- Error -->
      <div v-else-if="aptError" class="empty-box">
        <AlertCircle :size="24" />
        <span>{{ aptError }}</span>
        <button class="btn btn-ghost retry-btn" @click="retryAppointments">重试</button>
      </div>

      <!-- Empty -->
      <div v-else-if="bookedList.length === 0" class="empty-box">
        <CheckCircle :size="24" />
        <span>所有预约已完成 ✓</span>
      </div>

      <!-- List -->
      <template v-else>
        <ul class="pending-list">
          <li v-for="apt in bookedList.slice(0, 5)" :key="apt.id" class="pending-item">
            <span class="pending-time">{{ formatTime(apt.appointmentTime) }}</span>
            <span class="pending-name">{{ apt.customerName }}</span>
            <span class="pending-service">{{ apt.serviceName }}</span>
          </li>
        </ul>
        <div v-if="bookedList.length > 5" class="card-footer-link">
          <router-link to="/appointments">查看全部</router-link>
        </div>
      </template>
    </article>

    <article class="card dash-card customers-card">
      <header class="card-head">
        <div class="title-wrap">
          <UserPlus :size="18" class="title-icon" />
          <h3>最近新增客户</h3>
        </div>
      </header>

      <!-- Loading -->
      <div v-if="customersLoading" class="skeleton-list" aria-label="loading">
        <div v-for="i in 3" :key="i" class="skeleton-item" />
      </div>

      <!-- Error -->
      <div v-else-if="customersError" class="empty-box">
        <AlertCircle :size="24" />
        <span>{{ customersError }}</span>
        <button class="btn btn-ghost retry-btn" @click="loadCustomers">重试</button>
      </div>

      <!-- Empty -->
      <div v-else-if="recentCustomers.length === 0" class="empty-box">
        <Users :size="24" />
        <span>暂无新客户</span>
      </div>

      <!-- List -->
      <ul v-else class="customer-list">
        <li v-for="c in recentCustomers" :key="c.id" class="customer-item">
          <router-link :to="`/customers/${c.id}`" class="customer-name">{{ c.name }}</router-link>
          <span class="customer-phone">{{ maskPhone(c.phone) }}</span>
          <span class="customer-date">{{ formatDate(c.createdAt) }}</span>
        </li>
      </ul>
    </article>

    <!-- Birthday Card (existing, preserved) -->
    <article class="card dash-card birthday-card">
      <header class="card-head">
        <div class="title-wrap">
          <span class="emoji">🎂</span>
          <h3>本周生日客户</h3>
        </div>
        <button class="btn btn-ghost copy-btn" :disabled="birthdayLoading || !weeklyBirthdays.length" @click="copyBirthdayNames">
          复制名单
        </button>
      </header>

      <div v-if="birthdayLoading" class="skeleton-list" aria-label="loading">
        <div v-for="i in 4" :key="i" class="skeleton-item" />
      </div>

      <div v-else-if="weeklyBirthdays.length" class="birthday-list-wrap">
        <ul class="birthday-list">
          <li v-for="customer in weeklyBirthdays" :key="customer.id" class="birthday-item">
            <button class="name-btn" @click="onNameClick(customer)">{{ customer.name }}</button>
            <span class="birth-date">{{ formatBirthday(customer.birthday) }}</span>
            <span class="masked-phone">{{ maskPhone(customer.phone) }}</span>
          </li>
        </ul>
      </div>

      <div v-else class="empty-box">
        <span class="empty-icon">🎁</span>
        <span>本周暂无客户过生日</span>
      </div>
    </article>

    <!-- Row 3: Showcase Entry (spans 2-3 cols) -->
    <article class="card dash-card showcase-card">
      <header class="card-head">
        <div class="title-wrap">
          <Monitor :size="18" class="title-icon" />
          <h3>门店展示大屏</h3>
        </div>
      </header>
      <p class="showcase-desc">对外展示艾灸文化与服务项目，适合大屏或官网展示</p>

      <!-- iframe thumbnail preview -->
      <div class="preview-container" :style="previewContainerStyle">
        <!-- Loading state -->
        <div v-if="!iframeLoaded && !iframeError" class="preview-loading">
          <div class="skeleton-item preview-skeleton" />
          <span class="preview-loading-text">加载预览中…</span>
        </div>
        <!-- Error state -->
        <div v-else-if="iframeError" class="preview-error">
          <AlertCircle :size="20" />
          <span>预览暂时不可用</span>
        </div>
        <!-- iframe -->
        <iframe
          v-show="iframeLoaded"
          src="/welcome"
          class="preview-iframe"
          frameborder="0"
          scrolling="no"
          :style="iframeStyle"
          @load="onIframeLoad"
          @error="onIframeError"
        />
      </div>

      <div class="showcase-actions">
        <a class="btn btn-primary" href="/welcome" target="_blank" rel="noopener">
          <ExternalLink :size="16" />
          点击跳转
        </a>
        <button class="btn btn-ghost" @click="copyShowcaseLink">
          <Copy :size="16" />
          复制链接
        </button>
      </div>
    </article>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import {
  Calendar, Clock, BarChart3, UserPlus, Monitor, ExternalLink, Copy,
  AlertCircle, CheckCircle, Users, CalendarX
} from 'lucide-vue-next'
import { useDashboardData } from '../composables/useDashboardData'
import { listCustomers } from '../api/customer'
import { useUiStore } from '../stores/ui'
import type { CustomerResponse } from '../types/customer'

/* ── ui store ── */
const ui = useUiStore()

/* ── Today's appointments (shared via composable) ── */
const {
  appointments: aptData,
  loading: aptLoading,
  error: aptError,
  bookedList,
  completedCount,
  bookedCount,
  totalCount,
  fetchTodayAppointments
} = useDashboardData()

const retryAppointments = () => fetchTodayAppointments()

/* ── Recent customers ── */
const recentCustomers = ref<CustomerResponse[]>([])
const customersLoading = ref(false)
const customersError = ref('')

const loadCustomers = async () => {
  try {
    customersLoading.value = true
    customersError.value = ''
    const res = await listCustomers({ page: 1, size: 5, sort: 'created_at,desc' })
    recentCustomers.value = res.data.data.items || []
  } catch {
    customersError.value = '加载失败'
  } finally {
    customersLoading.value = false
  }
}

/* ── Birthday card data ── */
const birthdayLoading = ref(false)
const allCustomers = ref<CustomerResponse[]>([])

const pad2 = (n: number) => String(n).padStart(2, '0')

const extractMonthDay = (birthday?: string) => {
  if (!birthday) return null
  const text = String(birthday).trim()
  const fullMatch = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)
  if (fullMatch) return `${pad2(Number(fullMatch[2]))}-${pad2(Number(fullMatch[3]))}`
  const shortMatch = text.match(/^(\d{1,2})-(\d{1,2})$/)
  if (shortMatch) return `${pad2(Number(shortMatch[1]))}-${pad2(Number(shortMatch[2]))}`
  const dt = new Date(text)
  if (Number.isNaN(dt.getTime())) return null
  return `${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())}`
}

const getCurrentWeekKeys = () => {
  const now = new Date()
  const base = new Date(now)
  const weekday = base.getDay()
  const offsetToMonday = weekday === 0 ? -6 : 1 - weekday
  base.setHours(0, 0, 0, 0)
  base.setDate(base.getDate() + offsetToMonday)
  const keys: string[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(base)
    d.setDate(base.getDate() + i)
    keys.push(`${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`)
  }
  return keys
}

const weekKeys = computed(() => getCurrentWeekKeys())
const weekOrder = computed(() => new Map(weekKeys.value.map((k, idx) => [k, idx])))

const weeklyBirthdays = computed(() => {
  const set = new Set(weekKeys.value)
  return allCustomers.value
    .filter((c) => {
      const md = extractMonthDay(c.birthday)
      return !!md && set.has(md)
    })
    .sort((a, b) => {
      const aKey = extractMonthDay(a.birthday) || ''
      const bKey = extractMonthDay(b.birthday) || ''
      return (weekOrder.value.get(aKey) ?? 99) - (weekOrder.value.get(bKey) ?? 99)
    })
})

const loadBirthdayCustomers = async () => {
  try {
    birthdayLoading.value = true
    const res = await listCustomers({ page: 1, size: 200, sort: 'id,asc' })
    allCustomers.value = res.data.data.items || []
  } catch {
    /* silent — birthday card is non-critical */
  } finally {
    birthdayLoading.value = false
  }
}

/* ── Helpers ── */
const formatTime = (iso: string): string => {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

const formatDate = (iso?: string): string => {
  if (!iso) return '--'
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const formatBirthday = (birthday?: string) => {
  const md = extractMonthDay(birthday)
  if (!md) return '--'
  return md
}

const maskPhone = (phone?: string) => {
  if (!phone) return '未填写'
  const text = String(phone)
  if (!/^\d{11}$/.test(text)) return text
  return `${text.slice(0, 3)}****${text.slice(7)}`
}

const statusLabel = (status: string) => {
  if (status === 'BOOKED') return '已预约'
  if (status === 'COMPLETED') return '已完成'
  if (status === 'CANCELLED') return '已取消'
  return status
}

const statusClass = (status: string) => {
  if (status === 'BOOKED') return 'badge-booked'
  if (status === 'COMPLETED') return 'badge-completed'
  if (status === 'CANCELLED') return 'badge-cancelled'
  return ''
}

/* ── Birthday actions ── */
const copyBirthdayNames = async () => {
  if (!weeklyBirthdays.value.length) return
  const names = weeklyBirthdays.value.map((c) => c.name).join('、')
  try {
    await navigator.clipboard.writeText(names)
    ui.toast('生日客户名单已复制', 'success')
  } catch {
    ui.toast('复制失败，请手动复制', 'error')
  }
}

const onNameClick = (customer: CustomerResponse) => {
  ui.toast(`客户：${customer.name}`, 'info')
}

/* ── Showcase actions ── */
const iframeLoaded = ref(false)
const iframeError = ref(false)
const iframeHeight = ref(1200)

/* iframe intrinsic dimensions & scale */
const IFRAME_W = 1200
const CONTAINER_H = 320

/* Calculate dynamic scale based on container width */
const containerWidth = ref(IFRAME_W)
const iframeScale = computed(() => containerWidth.value / IFRAME_W)

const previewContainerStyle = computed(() => ({
  height: `${CONTAINER_H}px`,
  overflowY: 'auto' as const
}))

const iframeStyle = computed(() => ({
  width: `${IFRAME_W}px`,
  height: `${iframeHeight.value}px`,
  transform: `scale(${iframeScale.value}) translateX(-50%)`,
  transformOrigin: '0 0',
  left: '50%'
}))

let resizeObserver: ResizeObserver | null = null

const onIframeLoad = () => {
  iframeLoaded.value = true
  iframeError.value = false
  /*
   * Same-origin: inject CSS overrides then read actual page height.
   *
   * 1. Force hero to 800px instead of 100vh — prevents height feedback loop
   *    (iframe viewport = CSS height → 100vh grows → scrollHeight grows → infinity)
   * 2. Lock internal scroll so container scroll is the only navigation
   */
  try {
    const el = document.querySelector('.preview-iframe') as HTMLIFrameElement | null
    const doc = el?.contentDocument
    if (doc?.head) {
      const style = doc.createElement('style')
      style.textContent =
        '.hero{min-height:800px!important;height:auto!important}' +
        'html,body{overflow:hidden!important}'
      doc.head.appendChild(style)
    }
    /* Ensure light theme in iframe (WelcomePage is a public showcase — never dark) */
    if (doc?.documentElement) {
      doc.documentElement.classList.remove('dark')
      doc.documentElement.style.colorScheme = 'light'
    }
    const syncHeight = () => {
      if (doc?.body) {
        const h = doc.body.scrollHeight
        if (h > 0) iframeHeight.value = h + 40
      }
    }
    /* Wait two frames for layout recalc after style injection */
    requestAnimationFrame(() => requestAnimationFrame(syncHeight))
    /* Re-sync after async content (e.g. services API) loads */
    setTimeout(syncHeight, 1500)
    setTimeout(syncHeight, 4000)
  } catch { /* cross-origin — height detection not available */ }
}

const onIframeError = () => {
  iframeError.value = true
  iframeLoaded.value = false
}

const copyShowcaseLink = async () => {
  const url = `${window.location.origin}/welcome`
  try {
    await navigator.clipboard.writeText(url)
    ui.toast('链接已复制', 'success')
  } catch {
    ui.toast('复制失败，请手动复制', 'error')
  }
}

/* ── Lifecycle ── */
onMounted(() => {
  fetchTodayAppointments()
  loadCustomers()
  loadBirthdayCustomers()

  /* Observe preview container width for dynamic scale */
  const container = document.querySelector('.preview-container')
  if (container) {
    resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        containerWidth.value = entry.contentRect.width
      }
    })
    resizeObserver.observe(container)
  }
})

onUnmounted(() => {
  resizeObserver?.disconnect()
})
</script>

<style scoped>
/* ========== Page Grid ========== */
.dashboard-page {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

/* ========== Card Base ========== */
.dash-card {
  padding: 18px;
}

.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
  gap: 8px;
}

.title-wrap {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.title-icon {
  color: var(--brand);
  flex-shrink: 0;
}

h3 {
  margin: 0;
  color: var(--text-strong);
  font-size: 15px;
  font-weight: 600;
}

/* ========== Grid Placement ========== */
.appointments-card {
  grid-column: span 2;
}

.stats-card {
  grid-column: span 1;
}

.pending-card,
.customers-card,
.birthday-card {
  grid-column: span 1;
}

.showcase-card {
  grid-column: span 3;
}

/* ========== Skeleton ========== */
.skeleton-list {
  display: grid;
  gap: 10px;
}

.skeleton-item {
  height: 40px;
  border-radius: 10px;
  background: linear-gradient(90deg, rgba(148, 163, 184, 0.14) 25%, rgba(148, 163, 184, 0.24) 50%, rgba(148, 163, 184, 0.14) 75%);
  background-size: 240% 100%;
  animation: shimmer 1.2s infinite linear;
}

@keyframes shimmer {
  0% { background-position: 100% 0; }
  100% { background-position: -100% 0; }
}

/* ========== Empty State ========== */
.empty-box {
  min-height: 100px;
  border: 1px dashed var(--border);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--text-muted);
  font-size: 0.88rem;
  flex-wrap: wrap;
}

.retry-btn {
  font-size: 12px;
  padding: 4px 10px;
}

/* ========== Footer Link ========== */
.card-footer-link {
  margin-top: 10px;
  text-align: center;
}

.card-footer-link a {
  color: var(--brand);
  font-size: 0.82rem;
  font-weight: 500;
  transition: opacity 0.2s ease;
}

.card-footer-link a:hover {
  opacity: 0.8;
}

/* ========== Appointments List ========== */
.apt-list,
.pending-list,
.customer-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 8px;
}

.apt-item {
  display: grid;
  grid-template-columns: 52px 1fr 1fr auto;
  align-items: center;
  gap: 12px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--bg-subtle);
  padding: 10px 12px;
  font-size: 0.88rem;
}

.apt-time {
  font-weight: 600;
  color: var(--brand);
  font-variant-numeric: tabular-nums;
}

.apt-name {
  color: var(--text-strong);
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.apt-service {
  color: var(--text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Status badges */
.status-badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
}

.badge-booked {
  background: var(--brand-bg);
  color: var(--brand);
}

.badge-completed {
  background: var(--bg-subtle);
  color: var(--text-muted);
  border: 1px solid var(--border);
}

.badge-cancelled {
  background: var(--danger-bg);
  color: var(--danger);
}

/* ========== Stats ========== */
.stats-grid {
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 16px 0;
  gap: 8px;
}

.stats-grid.stats-dim {
  opacity: 0.45;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  flex: 1;
}

.stat-number {
  font-size: 2rem;
  font-weight: 700;
  color: var(--brand);
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.stat-completed {
  color: var(--text-muted);
}

.stat-booked {
  color: var(--brand);
}

.stat-label {
  font-size: 0.78rem;
  color: var(--text-muted);
  font-weight: 500;
}

.stat-divider {
  width: 1px;
  height: 36px;
  background: var(--border);
  flex-shrink: 0;
}

/* ========== Pending List ========== */
.pending-item {
  display: grid;
  grid-template-columns: 52px 1fr 1fr;
  align-items: center;
  gap: 10px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--bg-subtle);
  padding: 10px 12px;
  font-size: 0.88rem;
}

.pending-time {
  font-weight: 700;
  color: var(--brand);
  font-variant-numeric: tabular-nums;
}

.pending-name {
  color: var(--text-strong);
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pending-service {
  color: var(--text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ========== Recent Customers ========== */
.customer-item {
  display: grid;
  grid-template-columns: 1fr auto auto;
  align-items: center;
  gap: 12px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--bg-subtle);
  padding: 10px 12px;
  font-size: 0.88rem;
}

.customer-name {
  color: var(--text-strong);
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
  transition: color 0.2s ease;
}

.customer-name:hover {
  color: var(--brand);
}

.customer-phone {
  color: var(--text-muted);
  font-size: 0.82rem;
  white-space: nowrap;
}

.customer-date {
  color: var(--text-muted);
  font-size: 0.78rem;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

/* ========== Birthday Card ========== */
.emoji {
  font-size: 20px;
}

.copy-btn {
  font-size: 12px;
  padding: 4px 10px;
}

.birthday-list-wrap {
  max-height: 320px;
  overflow: auto;
  padding-right: 4px;
}

.birthday-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 8px;
}

.birthday-item {
  display: grid;
  grid-template-columns: minmax(120px, 1fr) auto auto;
  align-items: center;
  gap: 12px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--bg-subtle);
  padding: 10px 12px;
}

.name-btn {
  border: 0;
  background: transparent;
  color: var(--brand);
  font-weight: 600;
  text-align: left;
  cursor: pointer;
  padding: 0;
  font-size: inherit;
}

.name-btn:hover {
  text-decoration: underline;
}

.birth-date {
  color: var(--text-muted);
  font-size: 13px;
}

.masked-phone {
  color: var(--text-strong);
  font-size: 13px;
  letter-spacing: 0.02em;
}

.empty-icon {
  font-size: 20px;
}

/* ========== Showcase Card ========== */
.showcase-desc {
  color: var(--text-muted);
  font-size: 0.9rem;
  margin: 0 0 14px;
  line-height: 1.5;
}

.showcase-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 14px;
}

/* --- iframe preview container --- */
.preview-container {
  position: relative;
  width: 100%;
  height: 320px;
  overflow-x: hidden;
  overflow-y: auto;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--bg-panel);
  transition: border-color 0.2s ease;
}

.preview-container:hover {
  border-color: var(--primary);
}

.preview-container::after {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(15, 118, 110, 0.10);
  opacity: 0;
  transition: opacity 0.2s ease;
  pointer-events: none;
  z-index: 2;
  border-radius: 10px;
}

.preview-container:hover::after {
  opacity: 1;
}

.preview-iframe {
  position: absolute;
  top: 0;
  border: 0;
}

/* Loading state */
.preview-loading {
  position: absolute;
  inset: 0;
  z-index: 3;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  background: var(--bg-subtle);
}

.preview-skeleton {
  width: 80%;
  height: 60%;
}

.preview-loading-text {
  color: var(--text-muted);
  font-size: 0.82rem;
}

/* Error state */
.preview-error {
  position: absolute;
  inset: 0;
  z-index: 3;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--text-muted);
  font-size: 0.85rem;
  background: var(--bg-subtle);
}

/* ========== Responsive ========== */
@media (max-width: 1023px) and (min-width: 768px) {
  .dashboard-page {
    grid-template-columns: repeat(2, 1fr);
  }

  .appointments-card {
    grid-column: span 2;
  }

  .stats-card {
    grid-column: span 2;
  }

  .pending-card,
  .customers-card,
  .birthday-card {
    grid-column: span 1;
  }

  .showcase-card {
    grid-column: span 2;
  }
}

@media (max-width: 767px) {
  .dashboard-page {
    grid-template-columns: 1fr;
  }

  .appointments-card,
  .stats-card,
  .pending-card,
  .customers-card,
  .birthday-card,
  .showcase-card {
    grid-column: span 1;
  }

  .apt-item {
    grid-template-columns: 52px 1fr auto;
  }

  .apt-service {
    display: none;
  }

  .pending-item {
    grid-template-columns: 52px 1fr;
  }

  .pending-service {
    display: none;
  }

  .customer-item {
    grid-template-columns: 1fr auto;
  }

  .customer-date {
    display: none;
  }

  .birthday-item {
    grid-template-columns: 1fr;
    gap: 6px;
  }

  .stats-grid {
    gap: 4px;
  }

  .stat-number {
    font-size: 1.5rem;
  }
}
</style>
