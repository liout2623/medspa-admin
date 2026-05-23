<template>
  <div v-if="visible" class="mask" @mousedown.self="close">
    <div class="modal card" @click.stop>
      <h4>{{ editingId ? '编辑客户' : '新增客户' }}</h4>
      <p v-if="errorMessage" class="error-banner">{{ errorMessage }}</p>

      <div class="grid">
        <label>姓名</label><input class="input" v-model.trim="form.name" />
        <label>手机号</label><input class="input" v-model.trim="form.phone" />
        <label>邮箱</label><input class="input" v-model.trim="form.email" />
        <label>性别</label><select class="select" v-model="form.gender"><option value="">请选择</option><option value="男">男</option><option value="女">女</option></select>
        <label>标签</label><input class="input" v-model.trim="form.tags" />
        <label>生日</label><input class="input" type="date" v-model="form.birthday" />
        <label>备注</label><textarea class="input" rows="3" v-model.trim="form.note" style="resize: vertical;"></textarea>
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
import { createCustomer, updateCustomer } from '../../api/customer'
import { useUiStore } from '../../stores/ui'
import type { CustomerRequest, CustomerResponse } from '../../types/customer'

interface CustomerFormValue extends CustomerRequest {
  id?: number
}

const props = defineProps<{
  editingCustomer: CustomerFormValue | null
  visible: boolean
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'saved', value?: CustomerResponse): void
}>()

const ui = useUiStore()
const submitting = ref(false)
const errorMessage = ref('')

const defaultForm = (): CustomerRequest => ({
  name: '',
  phone: '',
  email: '',
  gender: '',
  tags: '',
  note: '',
  birthday: ''
})

const form = reactive<CustomerRequest>(defaultForm())

const editingId = computed(() => props.editingCustomer?.id ?? null)

const assignForm = (source: CustomerFormValue | null) => {
  const current = source ?? null
  form.name = current?.name || ''
  form.phone = current?.phone || ''
  form.email = current?.email || ''
  form.gender = current?.gender || ''
  form.tags = current?.tags || ''
  form.note = current?.note || ''
  form.birthday = current?.birthday || ''
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
  if (!form.name?.trim()) {
    errorMessage.value = '姓名不能为空'
    ui.toast('姓名不能为空', 'error')
    return
  }

  // 手机号格式校验：必须为11位纯数字
  const phoneVal = form.phone?.trim() || ''
  if (phoneVal && !/^1\d{10}$/.test(phoneVal)) {
    errorMessage.value = '手机号格式不正确，请输入11位数字（以1开头）'
    ui.toast('手机号格式不正确，请输入11位数字', 'error')
    return
  }

  // 邮箱格式校验：必须包含@且格式合法
  const emailVal = form.email?.trim() || ''
  if (emailVal && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
    errorMessage.value = '邮箱格式不正确，请输入合法的电子邮件地址'
    ui.toast('邮箱格式不正确，请输入合法的电子邮件', 'error')
    return
  }

  try {
    submitting.value = true
    const payload: CustomerRequest = {
      name: form.name.trim(),
      phone: form.phone?.trim() || '',
      email: form.email?.trim() || '',
      gender: form.gender?.trim() || '',
      tags: form.tags?.trim() || '',
      note: form.note?.trim() || '',
      birthday: form.birthday || ''
    }

    const response = editingId.value ? await updateCustomer(editingId.value, payload) : await createCustomer(payload)
    ui.toast(editingId.value ? '保存成功' : '创建成功', 'success')
    emit('saved', response.data.data)
    close()
  } catch (e: any) {
    const message = e?.response?.data?.message || e?.message || '保存失败'
    errorMessage.value = message
    ui.toast(message, 'error')
  } finally {
    submitting.value = false
  }
}

watch(
  () => [props.visible, props.editingCustomer] as const,
  ([visible]) => {
    if (visible) {
      assignForm(props.editingCustomer)
      resetState()
    }
  },
  { immediate: true }
)
</script>

<style scoped>
.mask{position:fixed;inset:0;background:var(--overlay);display:flex;align-items:center;justify-content:center;z-index:2000}
.modal{padding:18px;width:min(640px,96vw)}
.grid{display:grid;grid-template-columns:140px 1fr;gap:10px;align-items:center}
.actions{margin-top:16px;display:flex;justify-content:flex-end;gap:8px}
.error-banner{margin:0 0 12px;padding:10px 12px;border-radius:10px;background:rgba(225,29,72,.08);border:1px solid rgba(225,29,72,.18);color:#e11d48;font-size:13px;line-height:1.5}
html.dark .error-banner{background:rgba(225,29,72,.12);border-color:rgba(248,113,113,.24);color:#fca5a5}
@media (max-width: 720px){
  .grid{grid-template-columns:1fr}
}
</style>
