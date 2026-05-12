<template>
  <div v-if="visible" class="mask" @click.self="close">
    <div class="modal card" @click.stop>
      <h4>{{ editingId ? '编辑预约' : '新增预约' }}</h4>
      <p v-if="errorMessage" class="error-banner">{{ errorMessage }}</p>

      <div class="grid">
        <label>客户<span class="req">*</span></label>
        <select class="select" v-model.number="form.customerId">
          <option :value="0" disabled>请选择客户</option>
          <option v-for="c in customers" :key="c.id" :value="c.id">{{ c.name }}{{ c.phone ? ` (${c.phone})` : '' }}</option>
        </select>

        <label>服务项目<span class="req">*</span></label>
        <select class="select" v-model.number="form.serviceId">
          <option :value="0" disabled>请选择服务项目</option>
          <option v-for="s in services" :key="s.id" :value="s.id">{{ s.name }}（{{ s.durationMinutes || 60 }}分钟）</option>
        </select>

        <label>理疗师<span class="req">*</span></label>
        <template v-if="isAdmin">
          <select class="select" v-model.number="form.therapistId">
            <option :value="0" disabled>请选择理疗师</option>
            <option v-for="t in therapists" :key="t.id" :value="t.id">{{ t.displayName }}</option>
          </select>
        </template>
        <template v-else>
          <input class="input" :value="auth.user?.displayName || ''" disabled />
        </template>

        <label>日期<span class="req">*</span></label>
        <input class="input" type="date" v-model="form.dateText" />

        <label>开始时间<span class="req">*</span></label>
        <input class="input" type="time" v-model="form.timeText" step="300" />

        <label>备注</label>
        <textarea class="input" rows="3" v-model.trim="form.note" placeholder="可选" />
      </div>

      <div class="actions">
        <button class="btn btn-ghost" @click="close">取消</button>
        <button class="btn btn-primary" :disabled="submitting" @click="submit">
          {{ submitting ? '提交中...' : (editingId ? '保存' : '创建') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { createAppointment, updateAppointment } from '../../api/appointment'
import { listCustomers } from '../../api/customer'
import { listServices } from '../../api/service'
import { listTherapists } from '../../api/user'
import { useAuthStore } from '../../stores/auth'
import { useUiStore } from '../../stores/ui'
import type { AppointmentRequest, AppointmentResponse } from '../../types/appointment'
import type { CustomerResponse } from '../../types/customer'
import type { UserResponse } from '../../types/auth'
import type { ServiceResponse } from '../../api/service'

interface FormState {
  customerId: number
  serviceId: number
  therapistId: number
  dateText: string
  timeText: string
  note: string
}

const props = defineProps<{
  editingAppointment: AppointmentResponse | null
  initialDate: string
  initialTime: string
  visible: boolean
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'saved', value?: AppointmentResponse): void
}>()

const ui = useUiStore()
const auth = useAuthStore()
const submitting = ref(false)
const errorMessage = ref('')

const isAdmin = computed(() => auth.user?.role === 'ADMIN')

const customers = ref<CustomerResponse[]>([])
const services = ref<ServiceResponse[]>([])
const therapists = ref<UserResponse[]>([])

const defaultForm = (): FormState => ({
  customerId: 0,
  serviceId: 0,
  therapistId: 0,
  dateText: props.initialDate || todayStr(),
  timeText: props.initialTime || '09:00',
  note: ''
})

const form = reactive<FormState>(defaultForm())

const editingId = computed(() => props.editingAppointment?.id ?? null)

function todayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function isoDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const assignForm = (source: AppointmentResponse | null) => {
  if (!source) {
    Object.assign(form, defaultForm())
    // STAFF 用户锁定理疗师为自己
    if (!isAdmin.value && auth.user?.id) {
      form.therapistId = auth.user.id
    }
    return
  }
  form.customerId = source.customerId
  form.serviceId = source.serviceId
  form.therapistId = source.therapistId
  const startDate = new Date(source.appointmentTime)
  form.dateText = isoDateStr(startDate)
  form.timeText = `${String(startDate.getHours()).padStart(2, '0')}:${String(startDate.getMinutes()).padStart(2, '0')}`
  form.note = source.note || ''
}

const fetchOptions = async () => {
  try {
    const [custRes, svcRes, therapistRes] = await Promise.all([
      listCustomers({ page: 1, size: 100 }),
      listServices({ page: 1, size: 100, active: true }),
      listTherapists()
    ])
    customers.value = custRes.data.data.items || []
    services.value = svcRes.data.data.items || []
    therapists.value = therapistRes.data.data.items || []
  } catch {
    ui.toast('加载选项数据失败', 'error')
  }
}

const resetState = () => {
  errorMessage.value = ''
  submitting.value = false
}

const close = () => {
  emit('update:visible', false)
}

const submit = async () => {
  errorMessage.value = ''

  if (!form.customerId) {
    errorMessage.value = '请选择客户'
    ui.toast('请选择客户', 'error')
    return
  }
  if (!form.serviceId) {
    errorMessage.value = '请选择服务项目'
    ui.toast('请选择服务项目', 'error')
    return
  }
  if (!form.therapistId && isAdmin.value) {
    errorMessage.value = '请选择理疗师'
    ui.toast('请选择理疗师', 'error')
    return
  }
  if (!form.dateText) {
    errorMessage.value = '请选择日期'
    ui.toast('请选择日期', 'error')
    return
  }
  if (!form.timeText) {
    errorMessage.value = '请选择开始时间'
    ui.toast('请选择开始时间', 'error')
    return
  }

  try {
    submitting.value = true
    const payload: AppointmentRequest = {
      customerId: form.customerId,
      serviceId: form.serviceId,
      therapistId: isAdmin.value ? form.therapistId : (auth.user?.id || form.therapistId),
      appointmentTime: `${form.dateText}T${form.timeText}:00`,
      note: form.note?.trim() || undefined
    }

    const response = editingId.value
      ? await updateAppointment(editingId.value, payload)
      : await createAppointment(payload)
    ui.toast(editingId.value ? '保存成功' : '创建成功', 'success')
    emit('saved', response.data.data)
    close()
  } catch (e: any) {
    const status = e?.response?.status
    let message = e?.response?.data?.message || e?.message || '保存失败'
    if (status === 409) message = '该理疗师此时间段已被占用'
    if (status === 403) message = '无权限执行此操作'
    if (status === 400) message = e?.response?.data?.message || '请求参数错误'
    errorMessage.value = message
    ui.toast(message, 'error')
  } finally {
    submitting.value = false
  }
}

watch(
  () => props.visible as boolean,
  (visible) => {
    if (visible) {
      assignForm(props.editingAppointment)
      resetState()
      fetchOptions()
    }
  },
  { immediate: true }
)
</script>

<style scoped>
.mask{position:fixed;inset:0;background:var(--overlay);display:flex;align-items:center;justify-content:center;z-index:2000}
.modal{padding:18px;width:min(640px,96vw)}
.grid{display:grid;grid-template-columns:120px 1fr;gap:10px;align-items:center}
.actions{margin-top:16px;display:flex;justify-content:flex-end;gap:8px}
.error-banner{margin:0 0 12px;padding:10px 12px;border-radius:10px;background:rgba(225,29,72,.08);border:1px solid rgba(225,29,72,.18);color:var(--danger);font-size:13px;line-height:1.5}
html.dark .error-banner{background:rgba(225,29,72,.12);border-color:rgba(248,113,113,.24)}
.req{color:var(--danger);margin-left:2px}
@media (max-width: 720px){
  .grid{grid-template-columns:1fr}
}
</style>
