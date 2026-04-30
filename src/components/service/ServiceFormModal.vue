<template>
  <div v-if="visible" class="mask" @click.self="close">
    <div class="modal card" @click.stop>
      <h4>{{ editingId ? '编辑服务项目' : '新增服务项目' }}</h4>
      <p v-if="errorMessage" class="error-banner">{{ errorMessage }}</p>

      <div class="grid">
        <label>项目名称</label><input class="input" v-model.trim="form.name" maxlength="128" />
        <label>描述</label><textarea class="input" rows="4" v-model.trim="form.description" />
        <label>单价</label><input class="input" type="number" min="0" step="0.01" v-model="form.priceText" placeholder="如 298" />
        <label>预估时长</label><input class="input" type="number" min="0" step="1" v-model="form.durationText" placeholder="单位：分钟" />
        <label>启用状态</label>
        <select class="select" v-model="form.activeText">
          <option value="true">启用</option>
          <option value="false">停用</option>
        </select>
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
import { createService, updateService } from '../../api/service'
import { useUiStore } from '../../stores/ui'
import type { ServiceRequest, ServiceResponse } from '../../api/service'

interface ServiceFormValue extends Partial<ServiceRequest> {
  id?: number
}

const props = defineProps<{
  editingService: ServiceFormValue | null
  visible: boolean
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'saved', value?: ServiceResponse): void
}>()

const ui = useUiStore()
const submitting = ref(false)
const errorMessage = ref('')

const form = reactive({
  name: '',
  description: '',
  priceText: '',
  durationText: '',
  activeText: 'true'
})

const editingId = computed(() => props.editingService?.id ?? null)

const assignForm = (source: ServiceFormValue | null) => {
  form.name = source?.name || ''
  form.description = source?.description || ''
  form.priceText = source?.price !== undefined && source?.price !== null ? String(source.price) : ''
  form.durationText = source?.durationMinutes !== undefined && source?.durationMinutes !== null ? String(source.durationMinutes) : ''
  form.activeText = String(source?.active ?? true)
}

const resetState = () => {
  errorMessage.value = ''
  submitting.value = false
}

const close = () => {
  emit('update:visible', false)
}

const parseOptionalPositive = (value: string, fieldName: string) => {
  const text = String(value || '').trim()
  if (!text) return { value: undefined as number | undefined }
  const num = Number(text)
  if (!Number.isFinite(num) || num <= 0) {
    return { error: `${fieldName}必须为正数` }
  }
  return { value: num }
}

const submit = async () => {
  errorMessage.value = ''
  const name = form.name.trim()
  if (!name) {
    errorMessage.value = '项目名称不能为空'
    ui.toast('项目名称不能为空', 'error')
    return
  }
  if (name.length > 128) {
    errorMessage.value = '项目名称不能超过128个字符'
    ui.toast('项目名称不能超过128个字符', 'error')
    return
  }

  const priceResult = parseOptionalPositive(form.priceText, '价格')
  if ('error' in priceResult) {
    const message = priceResult.error || '价格必须为正数'
    errorMessage.value = message
    ui.toast(message, 'error')
    return
  }

  const durationResult = parseOptionalPositive(form.durationText, '时长')
  if ('error' in durationResult) {
    const message = durationResult.error || '时长必须为正数'
    errorMessage.value = message
    ui.toast(message, 'error')
    return
  }

  try {
    submitting.value = true
    const payload: ServiceRequest = {
      name,
      description: form.description.trim() || '',
      price: priceResult.value,
      durationMinutes: durationResult.value,
      active: form.activeText === 'true'
    }

    const response = editingId.value ? await updateService(editingId.value, payload) : await createService(payload)
    ui.toast(editingId.value ? '保存成功' : '创建成功', 'success')
    emit('saved', response.data.data)
    close()
  } catch (e: any) {
    const message = e?.response?.status === 403 ? '无权限执行该操作' : e?.response?.data?.message || e?.message || '保存失败'
    errorMessage.value = message
    ui.toast(message, 'error')
  } finally {
    submitting.value = false
  }
}

watch(
  () => [props.visible, props.editingService] as const,
  ([visible]) => {
    if (visible) {
      assignForm(props.editingService)
      resetState()
    }
  },
  { immediate: true }
)
</script>

<style scoped>
.mask{position:fixed;inset:0;background:var(--overlay);display:flex;align-items:center;justify-content:center;z-index:2000}
.modal{padding:18px;width:min(720px,96vw)}
.grid{display:grid;grid-template-columns:140px 1fr;gap:10px;align-items:center}
.actions{margin-top:16px;display:flex;justify-content:flex-end;gap:8px}
.error-banner{margin:0 0 12px;padding:10px 12px;border-radius:10px;background:rgba(225,29,72,.08);border:1px solid rgba(225,29,72,.18);color:#e11d48;font-size:13px;line-height:1.5}
html.dark .error-banner{background:rgba(225,29,72,.12);border-color:rgba(248,113,113,.24);color:#fca5a5}
@media (max-width: 720px){
  .grid{grid-template-columns:1fr}
}
</style>
