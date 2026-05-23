<template>
  <section class="card panel">
    <!-- Toolbar Row 1: Navigation -->
    <div class="toolbar toolbar-nav">
      <div class="view-toggle">
        <button :class="['toggle-btn', { active: viewMode === 'month' }]" @click="switchView('month')">月</button>
        <button :class="['toggle-btn', { active: viewMode === 'week' }]" @click="switchView('week')">周</button>
        <button :class="['toggle-btn', { active: viewMode === 'day' }]" @click="switchView('day')">日</button>
      </div>

      <div class="nav-group">
        <button class="btn btn-ghost" :disabled="loading || !canGoPrev" @click="goPrev"><ChevronLeft :size="16" /></button>
        <button class="btn btn-ghost" :disabled="loading" @click="goToday">今天</button>
        <button class="btn btn-ghost" :disabled="loading || !canGoNext" @click="goNext"><ChevronRight :size="16" /></button>
      </div>

      <span class="date-display">{{ dateDisplay }}</span>

      <div style="flex:1" />

      <button class="btn btn-primary" @click="openCreate">
        <Plus :size="16" />
        新增预约
      </button>
    </div>

    <!-- Toolbar Row 2: Filters -->
    <div class="toolbar toolbar-filters">
      <Filter :size="14" class="filter-icon" />
      <template v-if="isAdmin">
        <select class="select filter-select" v-model="therapistFilter" @change="load">
          <option :value="null">全部理疗师</option>
          <option v-for="t in therapistOptions" :key="t.id" :value="t.id">{{ t.displayName }}</option>
        </select>
      </template>
      <template v-else>
        <span class="filter-tag">理疗师：{{ currentUser?.displayName }}</span>
      </template>

      <div class="status-filters">
        <button :class="['status-btn', { active: !statusFilter }]" @click="setStatusFilter(null)">全部</button>
        <button :class="['status-btn sb-booked', { active: statusFilter === 'BOOKED' }]" @click="setStatusFilter('BOOKED')">已预约</button>
        <button :class="['status-btn sb-completed', { active: statusFilter === 'COMPLETED' }]" @click="setStatusFilter('COMPLETED')">已完成</button>
        <button :class="['status-btn sb-cancelled', { active: statusFilter === 'CANCELLED' }]" @click="setStatusFilter('CANCELLED')">已取消</button>
      </div>
    </div>

    <!-- Day View -->
    <div v-if="viewMode === 'day'" class="calendar-day">
      <div v-if="loading" class="cal-loading-overlay">
        <div class="cal-spinner" />
        <span>加载中…</span>
      </div>
      <div class="cal-scroll">
        <div class="cal-inner">
          <div class="time-axis">
            <div v-for="h in businessHours" :key="h" class="time-slot">
              <span class="time-label">{{ padHour(h) }}:00</span>
            </div>
          </div>
          <div class="day-body" ref="dayBodyRef" @click="onDayGridClick">
            <div v-for="h in businessHours" :key="'hl-' + h" class="hour-line" :style="{ top: ((h - START_HOUR) * HOUR_HEIGHT) + 'px' }" />
            <div v-if="isToday && nowLineTop >= 0" class="now-indicator" :style="{ top: nowLineTop + 'px' }">
              <span class="now-time-badge">{{ nowTimeStr }}</span>
              <span class="now-dot" />
              <span class="now-line" />
            </div>
            <div
              v-for="evt in dayPositionedEvents"
              :key="evt.id"
              class="appt-block"
              :class="'appt-' + evt.raw.status.toLowerCase()"
              :style="{ top: evt.top + 'px', height: evt.height + 'px', left: evt.left + '%', width: evt.width + '%' }"
              @click.stop="openDetail(evt.raw)"
            >
              <div class="appt-title">{{ evt.raw.customerName }} - {{ evt.raw.serviceName }}</div>
              <div class="appt-meta">{{ formatTime(evt.raw.appointmentTime) }} {{ evt.raw.therapistName }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Week View -->
    <div v-else-if="viewMode === 'week'" class="calendar-week">
      <div v-if="loading" class="cal-loading-overlay">
        <div class="cal-spinner" />
        <span>加载中…</span>
      </div>
      <div class="week-header">
        <div class="week-header-spacer" />
        <div
          v-for="d in weekDates"
          :key="'wh-' + d.key"
          class="week-header-cell"
          :class="{ today: d.isToday, 'out-of-range': d.outOfRange }"
          @click="!d.outOfRange && goToDate(d.date)"
        >
          <div class="week-day-name">{{ d.dayName }}</div>
          <div class="week-day-num">{{ d.dayNum }}</div>
        </div>
      </div>
      <div class="week-body-scroll">
        <div class="week-body">
          <div class="time-axis">
            <div v-for="h in businessHours" :key="h" class="time-slot">
              <span class="time-label">{{ padHour(h) }}:00</span>
            </div>
          </div>
          <div
            v-for="d in weekDates"
            :key="'wc-' + d.key"
            class="week-day-col"
            @click="onWeekColClick(d.date, $event)"
          >
            <div v-for="h in businessHours" :key="'wl-' + h" class="hour-line" :style="{ top: ((h - START_HOUR) * HOUR_HEIGHT) + 'px' }" />
            <div v-if="d.isToday && nowLineTop >= 0" class="now-indicator" :style="{ top: nowLineTop + 'px' }">
              <span class="now-dot" />
              <span class="now-line" />
            </div>
            <div
              v-for="evt in getWeekDayEvents(d.key)"
              :key="evt.id"
              class="appt-block"
              :class="'appt-' + evt.raw.status.toLowerCase()"
              :style="{ top: evt.top + 'px', height: evt.height + 'px', left: evt.left + '%', width: evt.width + '%' }"
              @click.stop="openDetail(evt.raw)"
            >
              <div class="appt-title">{{ evt.raw.customerName }}</div>
              <div class="appt-meta">{{ evt.raw.serviceName }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Month View -->
    <div v-else-if="viewMode === 'month'" class="calendar-month">
      <div v-if="loading" class="cal-loading-overlay">
        <div class="cal-spinner" />
        <span>加载中…</span>
      </div>
      <div class="month-header">
        <div v-for="name in ['周一', '周二', '周三', '周四', '周五', '周六', '周日']" :key="name" class="month-header-cell">{{ name }}</div>
      </div>
      <div class="month-body">
        <div v-for="(week, wi) in monthWeeks" :key="wi" class="month-week-row">
          <div
            v-for="d in week"
            :key="d.key"
            class="month-day-cell"
            :class="{ 'other-month': !d.inMonth, today: d.isToday, 'out-of-range': d.outOfRange && d.inMonth }"
            @click="d.inMonth && !d.outOfRange && onMonthDayClick(d.date)"
          >
            <div class="month-day-num">{{ d.dayNum }}</div>
            <div v-if="d.eventCount > 0" class="month-day-indicators">
              <span v-if="d.bookedCount > 0" class="dot dot-booked" />
              <span v-if="d.completedCount > 0" class="dot dot-completed" />
              <span v-if="d.cancelledCount > 0" class="dot dot-cancelled" />
              <span class="month-day-count">{{ d.eventCount }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Form Modal -->
  <AppointmentFormModal
    v-model:visible="formVisible"
    :editingAppointment="selectedAppointment"
    :initialDate="initialDate"
    :initialTime="initialTime"
    @saved="handleSaved"
  />

  <!-- Detail Modal -->
  <AppointmentDetailModal
    v-model:visible="detailVisible"
    :appointment="detailAppointment"
    @edit="handleEditFromDetail"
    @changed="handleStatusChanged"
    @deleted="handleDeleted"
  />
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { Plus, ChevronLeft, ChevronRight, Filter } from 'lucide-vue-next'
import { useAuthStore } from '../../stores/auth'
import { useUiStore } from '../../stores/ui'
import { listAppointments } from '../../api/appointment'
import { listTherapists } from '../../api/user'
import type { AppointmentResponse, AppointmentStatus } from '../../types/appointment'
import type { UserResponse } from '../../types/auth'
import AppointmentFormModal from '../../components/appointment/AppointmentFormModal.vue'
import AppointmentDetailModal from '../../components/appointment/AppointmentDetailModal.vue'

/* ── constants ── */
const START_HOUR = 8
const END_HOUR = 21
const HOUR_HEIGHT = 64
const MIN_HEIGHT = 28
const businessHours = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i)

/* ── positioned event type ── */
interface PositionedEvent {
  id: number
  top: number
  height: number
  left: number
  width: number
  raw: AppointmentResponse
}

/* ── layout item (internal) ── */
interface LayoutItem {
  id: number
  top: number
  height: number
  startMin: number
  endMin: number
  col: number
  maxCol: number
  raw: AppointmentResponse
}

/* ── month day type ── */
interface MonthDay {
  date: Date
  key: string
  dayNum: number
  inMonth: boolean
  isToday: boolean
  outOfRange: boolean
  eventCount: number
  bookedCount: number
  completedCount: number
  cancelledCount: number
}

/* ── stores ── */
const ui = useUiStore()
const auth = useAuthStore()

/* ── role helpers ── */
const isAdmin = computed(() => auth.user?.role === 'ADMIN')
const currentUser = computed(() => auth.user)

/* ── state ── */
const viewMode = ref<'day' | 'week' | 'month'>('month')
const currentDate = ref(new Date())
const therapistFilter = ref<number | null>(null)
const statusFilter = ref<AppointmentStatus | null>(null)
const loading = ref(false)
const appointments = ref<AppointmentResponse[]>([])
const therapistOptions = ref<UserResponse[]>([])

const formVisible = ref(false)
const selectedAppointment = ref<AppointmentResponse | null>(null)
const initialDate = ref('')
const initialTime = ref('')

const detailVisible = ref(false)
const detailAppointment = ref<AppointmentResponse | null>(null)

const dayBodyRef = ref<HTMLElement | null>(null)

/* ── now timer ── */
const now = ref(new Date())
let nowTimer: ReturnType<typeof setInterval> | null = null

/* ── helpers ── */
const padHour = (h: number) => String(h).padStart(2, '0')

const formatDateStr = (d: Date): string => {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const formatTime = (iso: string): string => {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

const isSameDay = (a: Date, b: Date): boolean =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()

const parseTimeToMinutes = (timeStr: string): number => {
  const d = new Date(timeStr)
  return d.getHours() * 60 + d.getMinutes()
}

const getMonday = (d: Date): Date => {
  const date = new Date(d)
  const day = date.getDay()
  const diff = (day === 0 ? -6 : 1) - day
  date.setDate(date.getDate() + diff)
  date.setHours(0, 0, 0, 0)
  return date
}

/* ── layout algorithm ── */
function layoutEvents(events: AppointmentResponse[]): PositionedEvent[] {
  if (!events.length) return []

  const items: LayoutItem[] = events
    .filter(evt => {
      const startMin = parseTimeToMinutes(evt.appointmentTime)
      return startMin >= START_HOUR * 60 - 30 && startMin < END_HOUR * 60 + 30
    })
    .map(evt => {
      const startMin = parseTimeToMinutes(evt.appointmentTime)
      const endMin = parseTimeToMinutes(evt.endTime)
      const clampedStart = Math.max(startMin, START_HOUR * 60)
      const clampedEnd = Math.min(endMin, END_HOUR * 60)
      return {
        id: evt.id,
        top: ((clampedStart - START_HOUR * 60) / 60) * HOUR_HEIGHT,
        height: Math.max(MIN_HEIGHT, ((clampedEnd - clampedStart) / 60) * HOUR_HEIGHT),
        startMin: clampedStart,
        endMin: clampedEnd,
        col: 0,
        maxCol: 1,
        raw: evt
      }
    })

  items.sort((a, b) => a.startMin - b.startMin || (b.endMin - b.startMin) - (a.endMin - a.startMin))

  const colEnds: number[] = []
  for (const item of items) {
    let placed = false
    for (let i = 0; i < colEnds.length; i++) {
      if (item.startMin >= colEnds[i]) {
        item.col = i
        colEnds[i] = item.endMin
        placed = true
        break
      }
    }
    if (!placed) {
      item.col = colEnds.length
      colEnds.push(item.endMin)
    }
  }

  for (const item of items) {
    let maxCol = 0
    for (const other of items) {
      if (other.startMin < item.endMin && other.endMin > item.startMin) {
        maxCol = Math.max(maxCol, other.col)
      }
    }
    item.maxCol = maxCol + 1
  }

  return items.map(item => ({
    id: item.id,
    top: item.top,
    height: item.height,
    left: (item.col / item.maxCol) * 100,
    width: (100 / item.maxCol) - 0.5,
    raw: item.raw
  }))
}

/* ── date range ── */
const todayStr = computed(() => formatDateStr(new Date()))
const maxDateStr = computed(() => {
  const d = new Date()
  d.setDate(d.getDate() + 14)
  return formatDateStr(d)
})

/* ── navigation boundary ── */
const canGoPrev = computed(() => {
  if (viewMode.value === 'day') {
    return formatDateStr(currentDate.value) > todayStr.value
  }
  if (viewMode.value === 'week') {
    const monday = getMonday(currentDate.value)
    return formatDateStr(monday) > todayStr.value
  }
  // month: prev month is entirely before today when this month's 1st <= today
  const firstDay = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth(), 1)
  return formatDateStr(firstDay) > todayStr.value
})

const canGoNext = computed(() => {
  if (viewMode.value === 'day') {
    return formatDateStr(currentDate.value) < maxDateStr.value
  }
  if (viewMode.value === 'week') {
    const monday = getMonday(currentDate.value)
    const nextMonday = new Date(monday)
    nextMonday.setDate(monday.getDate() + 7)
    return formatDateStr(nextMonday) <= maxDateStr.value
  }
  // month: next month's 1st must still be within range
  const nextMonthFirst = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() + 1, 1)
  return formatDateStr(nextMonthFirst) <= maxDateStr.value
})

/* ── computed ── */
const isToday = computed(() => isSameDay(currentDate.value, new Date()))

const nowLineTop = computed(() => {
  const minutes = now.value.getHours() * 60 + now.value.getMinutes()
  return ((minutes - START_HOUR * 60) / 60) * HOUR_HEIGHT
})

const nowTimeStr = computed(() => {
  return `${String(now.value.getHours()).padStart(2, '0')}:${String(now.value.getMinutes()).padStart(2, '0')}`
})

const dateDisplay = computed(() => {
  const d = currentDate.value
  const weekDays = ['日', '一', '二', '三', '四', '五', '六']
  if (viewMode.value === 'day') {
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 星期${weekDays[d.getDay()]}`
  }
  if (viewMode.value === 'month') {
    return `${d.getFullYear()}年${d.getMonth() + 1}月`
  }
  const mon = getMonday(d)
  const sun = new Date(mon)
  sun.setDate(mon.getDate() + 6)
  return `${mon.getFullYear()}年${mon.getMonth() + 1}月${mon.getDate()}日 — ${sun.getMonth() + 1}月${sun.getDate()}日`
})

const weekDates = computed(() => {
  const monday = getMonday(currentDate.value)
  const dayNames = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
  const today = new Date()
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const maxDay = new Date(todayStart)
  maxDay.setDate(maxDay.getDate() + 14)
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(monday)
    date.setDate(monday.getDate() + i)
    const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    return {
      date,
      key: formatDateStr(date),
      dayName: dayNames[i],
      dayNum: date.getDate(),
      isToday: isSameDay(date, today),
      outOfRange: dayStart < todayStart || dayStart > maxDay
    }
  })
})

const dayPositionedEvents = computed(() => layoutEvents(appointments.value))

const eventsByDate = computed(() => {
  const map = new Map<string, AppointmentResponse[]>()
  for (const a of appointments.value) {
    const d = new Date(a.appointmentTime)
    const key = formatDateStr(d)
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(a)
  }
  return map
})

const getWeekDayEvents = (dateKey: string): PositionedEvent[] => {
  const dayAppts = eventsByDate.value.get(dateKey) || []
  return layoutEvents(dayAppts)
}

const monthWeeks = computed(() => {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)

  // Find the Monday before or on the 1st
  const startDow = firstDay.getDay()
  const mondayOffset = startDow === 0 ? -6 : 1 - startDow
  const startDate = new Date(year, month, 1 + mondayOffset)

  // Calculate end: Sunday of the week containing the last day
  const endDate = new Date(lastDay)
  const endDow = endDate.getDay()
  const sundayOffset = endDow === 0 ? 0 : 7 - endDow
  endDate.setDate(endDate.getDate() + sundayOffset)

  const totalDays = Math.round((endDate.getTime() - startDate.getTime()) / 86400000) + 1
  const numWeeks = Math.ceil(totalDays / 7)

  const today = new Date()
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const maxDay = new Date(todayStart)
  maxDay.setDate(maxDay.getDate() + 14)
  const weeks: MonthDay[][] = []
  let currentWeek: MonthDay[] = []

  for (let i = 0; i < numWeeks * 7; i++) {
    const date = new Date(startDate)
    date.setDate(startDate.getDate() + i)
    const key = formatDateStr(date)
    const events = eventsByDate.value.get(key) || []
    const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate())

    currentWeek.push({
      date,
      key,
      dayNum: date.getDate(),
      inMonth: date.getMonth() === month,
      isToday: isSameDay(date, today),
      outOfRange: dayStart < todayStart || dayStart > maxDay,
      eventCount: events.length,
      bookedCount: events.filter(e => e.status === 'BOOKED').length,
      completedCount: events.filter(e => e.status === 'COMPLETED').length,
      cancelledCount: events.filter(e => e.status === 'CANCELLED').length
    })

    if (currentWeek.length === 7) {
      weeks.push(currentWeek)
      currentWeek = []
    }
  }

  return weeks
})

/* ── data fetching ── */
const load = async () => {
  try {
    loading.value = true
    const therapistId = isAdmin.value ? (therapistFilter.value ?? undefined) : currentUser.value?.id
    const baseParams = {
      therapistId,
      status: statusFilter.value || undefined,
      page: 1,
      size: 100,
      sort: 'appointment_time,asc'
    }

    if (viewMode.value === 'day') {
      const res = await listAppointments({ ...baseParams, date: formatDateStr(currentDate.value) })
      appointments.value = res.data.data.items || []
    } else if (viewMode.value === 'week') {
      // 周视图：一次请求整个周的日期范围
      const monday = getMonday(currentDate.value)
      const sunday = new Date(monday)
      sunday.setDate(monday.getDate() + 6)
      const res = await listAppointments({
        ...baseParams,
        startDate: formatDateStr(monday),
        endDate: formatDateStr(sunday)
      })
      appointments.value = res.data.data.items || []
    } else {
      // 月视图：一次请求整个月的日期范围
      const year = currentDate.value.getFullYear()
      const month = currentDate.value.getMonth()
      const startDate = new Date(year, month, 1)
      const endDate = new Date(year, month + 1, 0)
      const res = await listAppointments({
        ...baseParams,
        startDate: formatDateStr(startDate),
        endDate: formatDateStr(endDate)
      })
      appointments.value = res.data.data.items || []
    }
  } catch (e: any) {
    ui.toast(e?.response?.data?.message || '加载预约数据失败', 'error')
  } finally {
    loading.value = false
  }
}

const loadTherapists = async () => {
  try {
    const res = await listTherapists()
    // 前端双重保障：仅保留 STAFF 角色用户
    const items = res.data.data.items || []
    therapistOptions.value = items.filter(u => u.role === 'STAFF')
  } catch { /* silent */ }
}

/* ── navigation ── */
const goToday = () => { currentDate.value = new Date(); load() }
const goPrev = () => {
  const d = new Date(currentDate.value)
  if (viewMode.value === 'week') {
    d.setDate(d.getDate() - 7)
  } else if (viewMode.value === 'month') {
    // 先固定到1号再减月，避免31号跳月问题（如1月31日→2月28日→3月28日）
    d.setDate(1)
    d.setMonth(d.getMonth() - 1)
  } else {
    d.setDate(d.getDate() - 1)
  }
  currentDate.value = d
  load()
}
const goNext = () => {
  const d = new Date(currentDate.value)
  if (viewMode.value === 'week') {
    d.setDate(d.getDate() + 7)
  } else if (viewMode.value === 'month') {
    // 先固定到1号再加月，避免31号跳月问题
    d.setDate(1)
    d.setMonth(d.getMonth() + 1)
  } else {
    d.setDate(d.getDate() + 1)
  }
  currentDate.value = d
  load()
}
const goToDate = (d: Date) => {
  viewMode.value = 'day'
  currentDate.value = new Date(d)
  load()
}

const switchView = (mode: 'day' | 'week' | 'month') => {
  viewMode.value = mode
  load()
}

const setStatusFilter = (s: AppointmentStatus | null) => {
  statusFilter.value = s
  load()
}

/* ── event handlers ── */
const openCreate = () => {
  selectedAppointment.value = null
  // Clamp initial date to valid range (today ~ today+14)
  const current = formatDateStr(currentDate.value)
  initialDate.value = current < todayStr.value ? todayStr.value : (current > maxDateStr.value ? maxDateStr.value : current)
  initialTime.value = '09:00'
  // STAFF 用户锁定理疗师为自己
  if (!isAdmin.value && currentUser.value?.id) {
    therapistFilter.value = currentUser.value.id
  }
  formVisible.value = true
}

const openDetail = (appt: AppointmentResponse) => {
  detailAppointment.value = appt
  detailVisible.value = true
}

const onDayGridClick = (e: MouseEvent) => {
  if (!dayBodyRef.value) return
  const dateStr = formatDateStr(currentDate.value)
  if (dateStr < todayStr.value || dateStr > maxDateStr.value) return
  const rect = dayBodyRef.value.getBoundingClientRect()
  const y = e.clientY - rect.top
  const minutesFromStart = (y / HOUR_HEIGHT) * 60
  const totalMinutes = START_HOUR * 60 + Math.round(minutesFromStart / 30) * 30
  const hour = Math.min(END_HOUR - 1, Math.max(START_HOUR, Math.floor(totalMinutes / 60)))
  const minute = totalMinutes % 60 === 0 ? 0 : 30

  selectedAppointment.value = null
  initialDate.value = formatDateStr(currentDate.value)
  initialTime.value = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
  formVisible.value = true
}

const onWeekColClick = (date: Date, e: MouseEvent) => {
  const dateStr = formatDateStr(date)
  if (dateStr < todayStr.value || dateStr > maxDateStr.value) return
  const target = e.currentTarget as HTMLElement
  const rect = target.getBoundingClientRect()
  const y = e.clientY - rect.top
  const minutesFromStart = (y / HOUR_HEIGHT) * 60
  const totalMinutes = START_HOUR * 60 + Math.round(minutesFromStart / 30) * 30
  const hour = Math.min(END_HOUR - 1, Math.max(START_HOUR, Math.floor(totalMinutes / 60)))
  const minute = totalMinutes % 60 === 0 ? 0 : 30

  selectedAppointment.value = null
  initialDate.value = formatDateStr(date)
  initialTime.value = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
  formVisible.value = true
}

const onMonthDayClick = (date: Date) => {
  viewMode.value = 'day'
  currentDate.value = new Date(date)
  load()
}

const handleSaved = async () => {
  await load()
}

const handleEditFromDetail = (appt: AppointmentResponse) => {
  detailVisible.value = false
  selectedAppointment.value = appt
  const startDate = new Date(appt.appointmentTime)
  initialDate.value = formatDateStr(startDate)
  initialTime.value = `${String(startDate.getHours()).padStart(2, '0')}:${String(startDate.getMinutes()).padStart(2, '0')}`
  formVisible.value = true
}

const handleStatusChanged = async (appt: AppointmentResponse) => {
  detailAppointment.value = appt
  await load()
}

const handleDeleted = async () => {
  detailVisible.value = false
  detailAppointment.value = null
  await load()
}

/* ── lifecycle ── */
onMounted(() => {
  nowTimer = setInterval(() => { now.value = new Date() }, 60000)
  loadTherapists()
  // STAFF 用户自动锁定理疗师为自己
  if (!isAdmin.value && currentUser.value?.id) {
    therapistFilter.value = currentUser.value.id
  }
  load()
})

onUnmounted(() => {
  if (nowTimer) clearInterval(nowTimer)
})
</script>

<style scoped>
/* ── toolbar ── */
.toolbar{display:flex;gap:8px;align-items:center;flex-wrap:wrap;padding-bottom:10px;border-bottom:1px solid var(--border)}
.toolbar-nav{margin-bottom:0;padding-bottom:10px}
.toolbar-filters{margin-bottom:14px;border-bottom:none;padding-bottom:0;padding-top:10px;border-top:1px solid var(--border-soft)}
.view-toggle{display:flex;border:1px solid var(--border);border-radius:8px;overflow:hidden}
.toggle-btn{padding:6px 14px;border:0;cursor:pointer;font-size:.85rem;font-weight:600;background:var(--bg-soft);color:var(--text-muted);transition:all .2s ease}
.toggle-btn.active{background:var(--brand);color:#fff}
.toggle-btn:not(.active):hover{background:var(--bg-subtle)}
.nav-group{display:flex;gap:2px;align-items:center}
.date-display{font-weight:600;color:var(--text-strong);font-size:.92rem;white-space:nowrap}
.filter-icon{color:var(--text-muted);flex-shrink:0;margin-right:2px}
.filter-tag{font-size:.82rem;font-weight:500;color:var(--text-strong);background:var(--brand-bg);border:1px solid var(--brand);border-radius:6px;padding:4px 10px;white-space:nowrap}
.filter-select{max-width:160px}
.status-filters{display:flex;gap:4px}
.status-btn{padding:5px 10px;border:1px solid var(--border);border-radius:6px;font-size:.8rem;font-weight:500;cursor:pointer;background:var(--bg-soft);color:var(--text-muted);transition:all .2s ease}
.status-btn:hover{border-color:var(--border-strong)}
.status-btn.active{border-color:var(--brand);background:var(--brand-bg);color:var(--brand)}
.sb-booked.active{border-color:var(--brand);background:var(--brand-bg);color:var(--brand)}
.sb-completed.active{border-color:var(--text-muted);color:var(--text-strong)}
.sb-cancelled.active{border-color:var(--danger);background:var(--danger-bg);color:var(--danger)}

/* ── calendar shared ── */
.cal-loading-overlay{position:absolute;inset:0;z-index:10;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;background:var(--bg-panel);opacity:.75;border-radius:10px;pointer-events:all}
.cal-spinner{width:28px;height:28px;border:3px solid var(--border);border-top-color:var(--brand);border-radius:50%;animation:cal-spin .7s linear infinite}
@keyframes cal-spin{to{transform:rotate(360deg)}}
.cal-loading-overlay span{font-size:.82rem;color:var(--text-muted);font-weight:500}
.time-axis{width:72px;flex-shrink:0;padding-right:4px}
.time-slot{height:64px;position:relative}
.time-label{position:absolute;top:0;right:0;font-size:.75rem;color:var(--text-muted);font-variant-numeric:tabular-nums;white-space:nowrap;line-height:1;padding-top:1px}
.hour-line{position:absolute;left:0;right:0;height:1px;background:var(--border-soft)}

/* ── now indicator (current time) ── */
.now-indicator{position:absolute;left:-2px;right:0;height:0;z-index:5;pointer-events:none;display:flex;align-items:center}
.now-line{flex:1;height:2px;background:linear-gradient(90deg,var(--danger),var(--danger) 60%,transparent);border-radius:1px;box-shadow:0 0 6px rgba(220,53,69,.35)}
.now-dot{position:relative;z-index:1;width:10px;height:10px;border-radius:50%;background:var(--danger);flex-shrink:0;box-shadow:0 0 0 3px rgba(220,53,69,.2),0 0 8px rgba(220,53,69,.3)}
.now-time-badge{position:absolute;left:-2px;top:-20px;font-size:.7rem;font-weight:700;color:#fff;background:var(--danger);padding:1px 6px;border-radius:4px;line-height:1.4;white-space:nowrap;box-shadow:0 1px 4px rgba(220,53,69,.35)}

/* ── appointment blocks ── */
.appt-block{position:absolute;border-radius:6px;padding:4px 8px;cursor:pointer;overflow:hidden;z-index:3;border-left:3px solid;transition:transform .15s ease,box-shadow .15s ease}
.appt-block:hover{transform:translateY(-1px);box-shadow:0 4px 12px rgba(0,0,0,.1);z-index:4}
.appt-title{font-size:.8rem;font-weight:600;line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.appt-meta{font-size:.7rem;opacity:.8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}

.appt-booked{background:var(--brand-bg);border-left-color:var(--brand);color:var(--text-strong)}
.appt-completed{background:var(--bg-subtle);border-left-color:var(--text-muted);color:var(--text-muted)}
.appt-cancelled{background:var(--danger-bg);border-left-color:var(--danger);color:var(--text-muted)}
.appt-cancelled .appt-title{text-decoration:line-through}

/* ── day view ── */
.calendar-day{position:relative;border:1px solid var(--border);border-radius:10px;overflow:hidden;background:var(--bg-panel)}
.cal-scroll{overflow-y:auto;max-height:calc(100vh - 220px)}
.cal-inner{display:flex;position:relative}
.day-body{flex:1;position:relative;height:832px}
.day-body .hour-line{position:absolute;left:0;right:0}

/* ── week view ── */
.calendar-week{position:relative;border:1px solid var(--border);border-radius:10px;overflow:hidden;background:var(--bg-panel)}
.week-header{display:flex;border-bottom:1px solid var(--border);overflow-y:auto;scrollbar-gutter:stable}
.week-header-spacer{width:72px;flex-shrink:0}
.week-header-cell{flex:1;text-align:center;padding:10px 4px;cursor:pointer;transition:background .2s ease;border-right:1px solid var(--border-soft)}
.week-header-cell:last-child{border-right:none}
.week-header-cell:hover{background:var(--table-hover)}
.week-header-cell.today .week-day-num{background:var(--brand);color:#fff;border-radius:50%;width:28px;height:28px;display:inline-flex;align-items:center;justify-content:center}
.week-day-name{font-size:.75rem;color:var(--text-muted);font-weight:500}
.week-day-num{font-size:1rem;font-weight:700;color:var(--text-strong);margin-top:2px}
.week-header-cell.out-of-range{opacity:.4;cursor:default}
.week-header-cell.out-of-range .week-day-num{color:var(--text-muted)}
.week-header-cell.out-of-range:hover{background:transparent}

.week-body-scroll{overflow-y:auto;max-height:calc(100vh - 260px)}
.week-body{display:flex;position:relative}
.week-day-col{flex:1;position:relative;border-right:1px solid var(--border-soft)}
.week-day-col:last-child{border-right:none}

/* ── grid heights (13 hours × 64px = 832px) ── */
.cal-inner .time-axis,
.week-body .time-axis,
.day-body,
.week-day-col{height:832px}

/* ── month view ── */
.calendar-month{position:relative;border:1px solid var(--border);border-radius:10px;overflow:hidden;background:var(--bg-panel)}
.month-header{display:grid;grid-template-columns:repeat(7,1fr);border-bottom:1px solid var(--border)}
.month-header-cell{text-align:center;padding:10px 4px;font-size:.8rem;font-weight:600;color:var(--text-muted);background:var(--table-head)}
.month-week-row{display:grid;grid-template-columns:repeat(7,1fr);border-bottom:1px solid var(--border-soft)}
.month-week-row:last-child{border-bottom:none}
.month-day-cell{min-height:90px;padding:6px 8px;cursor:pointer;transition:background .15s ease;border-right:1px solid var(--border-soft)}
.month-day-cell:last-child{border-right:none}
.month-day-cell:hover{background:var(--table-hover)}
.month-day-cell.other-month{opacity:.35;cursor:default}
.month-day-cell.other-month:hover{background:transparent}
.month-day-cell.out-of-range{opacity:.4;cursor:default}
.month-day-cell.out-of-range:hover{background:transparent}
.month-day-cell.out-of-range .month-day-num{color:var(--text-muted)}
.month-day-cell.today .month-day-num{background:var(--brand);color:#fff;border-radius:50%;width:28px;height:28px;display:inline-flex;align-items:center;justify-content:center}
.month-day-num{font-size:.9rem;font-weight:600;color:var(--text-strong);line-height:1}
.month-day-indicators{display:flex;align-items:center;gap:4px;margin-top:4px;flex-wrap:wrap}
.month-day-count{font-size:.7rem;font-weight:600;color:var(--text-muted);margin-left:2px}
.dot{width:7px;height:7px;border-radius:50%;flex-shrink:0}
.dot-booked{background:var(--brand)}
.dot-completed{background:var(--text-muted)}
.dot-cancelled{background:var(--danger)}

/* ── responsive ── */
@media (max-width: 860px){
  .toolbar{gap:6px}
  .filter-select{max-width:120px}
  .status-filters{display:none}
  .date-display{font-size:.82rem}
}
</style>
