import { ref, computed } from 'vue'
import { listAppointments } from '../api/appointment'
import type { AppointmentResponse } from '../types/appointment'

const appointments = ref<AppointmentResponse[]>([])
const loading = ref(false)
const error = ref('')

function getTodayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

async function fetchTodayAppointments() {
  try {
    loading.value = true
    error.value = ''
    const res = await listAppointments({
      date: getTodayStr(),
      size: 50,
      sort: 'appointment_time,asc'
    })
    appointments.value = res.data.data.items || []
  } catch {
    error.value = '加载失败'
  } finally {
    loading.value = false
  }
}

export function useDashboardData() {
  const bookedList = computed(() =>
    appointments.value.filter(a => a.status === 'BOOKED')
  )
  const completedCount = computed(() =>
    appointments.value.filter(a => a.status === 'COMPLETED').length
  )
  const bookedCount = computed(() => bookedList.value.length)
  const totalCount = computed(() => appointments.value.length)

  return {
    appointments,
    loading,
    error,
    bookedList,
    completedCount,
    bookedCount,
    totalCount,
    fetchTodayAppointments
  }
}
