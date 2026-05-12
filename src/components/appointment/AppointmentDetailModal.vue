<template>
  <div v-if="visible" class="mask" @click.self="close">
    <div class="modal card" @click.stop>
      <h4>预约详情</h4>

      <div class="detail-grid">
        <label>客户</label>
        <span class="detail-value">{{ appointment?.customerName }}</span>

        <label>服务项目</label>
        <span class="detail-value">{{ appointment?.serviceName }}<template v-if="durationMinutes"> · {{ durationMinutes }}分钟</template></span>

        <label>理疗师</label>
        <span class="detail-value">{{ appointment?.therapistName }}</span>

        <label>预约时间</label>
        <span class="detail-value">{{ formatDateTime(appointment?.appointmentTime) }} — {{ formatTimeOnly(appointment?.endTime) }}</span>

        <label>状态</label>
        <span class="detail-value">
          <span class="badge" :class="statusBadgeClass">{{ statusText }}</span>
        </span>

        <label>备注</label>
        <span class="detail-value">{{ appointment?.note || '无' }}</span>
      </div>

      <div class="actions">
        <button class="btn btn-ghost" @click="close">关闭</button>
        <template v-if="appointment?.status === 'BOOKED' && canModify">
          <button class="btn btn-ghost" @click="handleEdit">
            <Edit2 :size="14" />编辑
          </button>
          <button class="btn btn-primary" @click="handleComplete">
            <Check :size="14" />完成预约
          </button>
          <button class="btn btn-ghost btn-cancel-apt" @click="handleCancelApt">
            <XCircle :size="14" />取消预约
          </button>
        </template>
        <button v-if="isAdmin" class="btn btn-ghost btn-cancel-apt" @click="handleDelete">
          <Trash2 :size="14" />删除
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Edit2, Check, XCircle, Trash2 } from 'lucide-vue-next'
import { useAuthStore } from '../../stores/auth'
import { useUiStore } from '../../stores/ui'
import { updateAppointmentStatus, deleteAppointment } from '../../api/appointment'
import type { AppointmentResponse, AppointmentStatus } from '../../types/appointment'

const props = defineProps<{
  appointment: AppointmentResponse | null
  visible: boolean
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'edit', value: AppointmentResponse): void
  (e: 'changed', value: AppointmentResponse): void
  (e: 'deleted'): void
}>()

const auth = useAuthStore()
const ui = useUiStore()

const isAdmin = computed(() => auth.user?.role === 'ADMIN')
const isOwnAppointment = computed(() => auth.user?.id === props.appointment?.therapistId)
const canModify = computed(() => isAdmin.value || isOwnAppointment.value)

const durationMinutes = computed(() => {
  const a = props.appointment
  if (!a) return 0
  // 优先使用后端返回的 durationMinutes
  if (a.durationMinutes) return a.durationMinutes
  // 回退：从 appointmentTime 和 endTime 计算
  if (a.appointmentTime && a.endTime) {
    const diff = (new Date(a.endTime).getTime() - new Date(a.appointmentTime).getTime()) / 60000
    return diff > 0 ? Math.round(diff) : 0
  }
  return 0
})

const statusBadgeClass = computed(() => {
  switch (props.appointment?.status) {
    case 'BOOKED': return 'badge-on'
    case 'COMPLETED': return 'badge-completed'
    case 'CANCELLED': return 'badge-off'
    default: return ''
  }
})

const statusText = computed(() => {
  switch (props.appointment?.status) {
    case 'BOOKED': return '已预约'
    case 'COMPLETED': return '已完成'
    case 'CANCELLED': return '已取消'
    default: return '-'
  }
})

const formatDateTime = (iso?: string) => {
  if (!iso) return '-'
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

const formatTimeOnly = (iso?: string) => {
  if (!iso) return '-'
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

const close = () => {
  emit('update:visible', false)
}

const handleEdit = () => {
  if (props.appointment) emit('edit', props.appointment)
}

const handleComplete = async () => {
  if (!props.appointment) return
  try {
    const res = await updateAppointmentStatus(props.appointment.id, 'COMPLETED' as AppointmentStatus)
    ui.toast('预约已完成', 'success')
    emit('changed', res.data.data)
  } catch (e: any) {
    const msg = e?.response?.data?.message || '操作失败'
    ui.toast(msg, 'error')
  }
}

const handleCancelApt = async () => {
  if (!props.appointment) return
  const ok = await ui.confirm('取消预约', '确认取消该预约？取消后不可恢复。')
  if (!ok) return
  try {
    const res = await updateAppointmentStatus(props.appointment.id, 'CANCELLED' as AppointmentStatus)
    ui.toast('预约已取消', 'success')
    emit('changed', res.data.data)
  } catch (e: any) {
    const msg = e?.response?.data?.message || '操作失败'
    ui.toast(msg, 'error')
  }
}

const handleDelete = async () => {
  if (!props.appointment) return
  const ok = await ui.confirm('删除预约', '确认删除该预约？此操作不可恢复。')
  if (!ok) return
  try {
    await deleteAppointment(props.appointment.id)
    ui.toast('预约已删除', 'success')
    emit('deleted')
  } catch (e: any) {
    const status = e?.response?.status
    const msg = status === 403 ? '无权限执行此操作' : (e?.response?.data?.message || '删除失败')
    ui.toast(msg, 'error')
  }
}
</script>

<style scoped>
.mask{position:fixed;inset:0;background:var(--overlay);display:flex;align-items:center;justify-content:center;z-index:2000}
.modal{padding:18px;width:min(560px,96vw)}
.detail-grid{display:grid;grid-template-columns:100px 1fr;gap:12px;align-items:center;margin-bottom:4px}
.detail-grid label{font-size:.88rem;color:var(--text-muted);font-weight:500;text-align:right}
.detail-value{font-size:.92rem;color:var(--text-strong);word-break:break-word}
.actions{margin-top:16px;display:flex;justify-content:flex-end;gap:8px;flex-wrap:wrap}
.btn-cancel-apt{color:var(--danger)}
.badge-completed{background:var(--bg-subtle);color:var(--text-muted);border:1px solid var(--border)}
html.dark .badge-completed{background:var(--bg-elevated);color:var(--text-muted);border:1px solid var(--border)}
@media (max-width: 720px){
  .detail-grid{grid-template-columns:1fr}
  .detail-grid label{text-align:left}
}
</style>
