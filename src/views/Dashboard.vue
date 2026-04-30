<template>
  <section class="dashboard-page">
    <article class="card birthday-card">
      <header class="card-head">
        <div class="title-wrap">
          <span class="emoji">🎂</span>
          <h3>本周生日客户</h3>
        </div>
        <button class="btn btn-ghost copy-btn" :disabled="loading || !weeklyBirthdays.length" @click="copyBirthdayNames">
          复制名单
        </button>
      </header>

      <div v-if="loading" class="skeleton-list" aria-label="loading">
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
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { listCustomers } from '../api/customer'
import { useUiStore } from '../stores/ui'
import type { CustomerResponse } from '../types/customer'

const ui = useUiStore()
const loading = ref(false)
const customers = ref<CustomerResponse[]>([])

const pad2 = (n: number) => String(n).padStart(2, '0')

const extractMonthDay = (birthday?: string) => {
  if (!birthday) return null
  const text = String(birthday).trim()

  const fullMatch = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)
  if (fullMatch) {
    return `${pad2(Number(fullMatch[2]))}-${pad2(Number(fullMatch[3]))}`
  }

  const shortMatch = text.match(/^(\d{1,2})-(\d{1,2})$/)
  if (shortMatch) {
    return `${pad2(Number(shortMatch[1]))}-${pad2(Number(shortMatch[2]))}`
  }

  const dt = new Date(text)
  if (Number.isNaN(dt.getTime())) return null
  return `${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())}`
}

const getCurrentWeekKeys = () => {
  const now = new Date()
  const base = new Date(now)
  const weekday = base.getDay() // 0 Sun - 6 Sat
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
  return customers.value
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

const formatBirthday = (birthday?: string) => {
  const md = extractMonthDay(birthday)
  if (!md) return '--'
  const [m, d] = md.split('-')
  return `${m}-${d}`
}

const maskPhone = (phone?: string) => {
  if (!phone) return '-'
  const text = String(phone)
  if (!/^\d{11}$/.test(text)) return text
  return `${text.slice(0, 3)}****${text.slice(7)}`
}

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

const loadCustomers = async () => {
  try {
    loading.value = true
    const res = await listCustomers({ page: 1, size: 200, sort: 'id,asc' })
    customers.value = res.data.data.items || []
  } catch (e: any) {
    ui.toast(e?.response?.data?.message || '加载生日客户失败', 'error')
  } finally {
    loading.value = false
  }
}

onMounted(loadCustomers)
</script>

<style scoped>
.dashboard-page {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 16px;
}

.birthday-card {
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

.emoji {
  font-size: 20px;
}

h3 {
  margin: 0;
  color: var(--text-strong);
  font-size: 18px;
}

.copy-btn {
  font-size: 12px;
  padding: 4px 10px;
}

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

.empty-box {
  min-height: 120px;
  border: 1px dashed var(--border);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--text-muted);
}

.empty-icon {
  font-size: 20px;
}

@media (max-width: 760px) {
  .birthday-item {
    grid-template-columns: 1fr;
    gap: 6px;
  }
}
</style>
