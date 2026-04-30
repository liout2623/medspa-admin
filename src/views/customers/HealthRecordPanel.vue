<template>
  <div>
    <!-- Section title -->
    <h3 class="section-title">健康档案</h3>

    <!-- Panel header -->
    <div class="panel-head">
      <span class="record-count">共 {{ total }} 条记录</span>
      <button class="btn btn-primary" @click="openCreate">
        <Plus :size="16" />
        新增记录
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="empty-hint">加载中...</div>

    <!-- Empty state -->
    <div v-else-if="!records.length" class="empty-hint">
      <FileText :size="32" style="color:#cbd5e1;margin-bottom:8px" />
      <span>暂无健康档案记录</span>
    </div>

    <!-- Record list -->
    <div v-else class="record-list">
      <div v-for="r in records" :key="r.id" class="record-card">
        <div class="record-meta">
          <span class="record-date">{{ formatDate(r.recordDate) }}</span>
          <span class="record-by">{{ r.createdByName }}</span>
        </div>
        <div class="record-body">
          <div class="record-field">
            <span class="field-label">评估</span>
            <span class="field-text">{{ r.assessment }}</span>
          </div>
          <div v-if="r.recommendation" class="record-field">
            <span class="field-label">建议</span>
            <span class="field-text">{{ r.recommendation }}</span>
          </div>
        </div>
        <div class="record-actions">
          <button v-if="canModify(r)" class="btn-mini edit" @click="openEdit(r)" title="编辑">
            <Edit2 :size="14" />
          </button>
          <button v-if="canModify(r)" class="btn-mini del" @click="onDelete(r.id)" title="删除">
            <Trash2 :size="14" />
          </button>
        </div>
      </div>
    </div>

    <!-- Pager -->
    <div v-if="totalPage > 1" class="pager">
      <button class="btn btn-ghost" :disabled="page <= 1 || loading" @click="page--; load()">上一页</button>
      <span>第 {{ page }} 页 / 共 {{ totalPage }} 页（总数 {{ total }}）</span>
      <button class="btn btn-ghost" :disabled="page >= totalPage || loading" @click="page++; load()">下一页</button>
    </div>

    <!-- New / Edit modal -->
    <div v-if="showModal" class="mask" @click="closeModal">
      <div class="modal card" @click.stop>
        <h4>{{ editingId ? '编辑记录' : '新增记录' }}</h4>
        <div class="grid">
          <label>日期</label>
          <input class="input" type="date" v-model="form.recordDate" />
          <label>评估</label>
          <textarea class="input" rows="4" v-model.trim="form.assessment" style="resize:vertical" />
          <label>建议</label>
          <textarea class="input" rows="4" v-model.trim="form.recommendation" style="resize:vertical" />
        </div>
        <div class="actions">
          <button class="btn btn-ghost" @click="closeModal">取消</button>
          <button class="btn btn-primary" :disabled="submitting" @click="onSubmit">
            {{ submitting ? '提交中...' : (editingId ? '保存' : '创建') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { Edit2, FileText, Plus, Trash2 } from 'lucide-vue-next'
import { useUiStore } from '../../stores/ui'
import {
  createHealthRecord,
  deleteHealthRecord,
  listHealthRecords,
  updateHealthRecord
} from '../../api/health-record'
import type { HealthRecordResponse } from '../../types/health-record'

const props = defineProps<{
  customerId: number
  currentUser: { id?: number; role?: string } | null
}>()

const ui = useUiStore()

const records = ref<HealthRecordResponse[]>([])
const total = ref(0)
const page = ref(1)
const size = ref(5)
const loading = ref(false)
const submitting = ref(false)

const totalPage = computed(() => Math.max(1, Math.ceil(total.value / size.value)))
const parseErr = (e: any, fallback: string) => e?.response?.data?.message || fallback

const formatDate = (d?: string) => {
  if (!d) return '-'
  return d.slice(0, 10)
}

const canModify = (r: HealthRecordResponse) =>
  props.currentUser?.role === 'ADMIN' || props.currentUser?.id === r.createdById

const load = async () => {
  try {
    loading.value = true
    const res = await listHealthRecords(props.customerId, { page: page.value, size: size.value })
    records.value = res.data.data.items || []
    total.value = res.data.data.total || 0
  } catch (e: any) {
    ui.toast(parseErr(e, '加载健康档案失败'), 'error')
  } finally {
    loading.value = false
  }
}

watch(() => props.customerId, () => { page.value = 1; load() })
onMounted(load)

// Modal state
const showModal = ref(false)
const editingId = ref<number | null>(null)
const form = ref({ recordDate: '', assessment: '', recommendation: '' })

const openCreate = () => {
  editingId.value = null
  form.value = { recordDate: new Date().toISOString().slice(0, 10), assessment: '', recommendation: '' }
  showModal.value = true
}
const openEdit = (r: HealthRecordResponse) => {
  editingId.value = r.id
  form.value = { recordDate: r.recordDate?.slice(0, 10) || '', assessment: r.assessment || '', recommendation: r.recommendation || '' }
  showModal.value = true
}
const closeModal = () => { showModal.value = false }

const onSubmit = async () => {
  if (!form.value.recordDate) return ui.toast('请选择日期', 'error')
  if (!form.value.assessment?.trim()) return ui.toast('评估内容不能为空', 'error')
  try {
    submitting.value = true
    const payload = {
      recordDate: form.value.recordDate,
      assessment: form.value.assessment.trim(),
      recommendation: form.value.recommendation?.trim() || undefined
    }
    if (editingId.value) {
      await updateHealthRecord(props.customerId, editingId.value, payload)
    } else {
      await createHealthRecord(props.customerId, payload)
    }
    closeModal()
    page.value = editingId.value ? page.value : 1
    await load()
    ui.toast(editingId.value ? '保存成功' : '创建成功', 'success')
  } catch (e: any) {
    ui.toast(parseErr(e, '保存失败'), 'error')
  } finally {
    submitting.value = false
  }
}

const onDelete = async (id: number) => {
  const ok = await ui.confirm('删除确认', '确认删除该健康档案记录？')
  if (!ok) return
  try {
    await deleteHealthRecord(props.customerId, id)
    if (records.value.length === 1 && page.value > 1) page.value--
    await load()
    ui.toast('删除成功', 'success')
  } catch (e: any) {
    ui.toast(parseErr(e, '删除失败'), 'error')
  }
}
</script>

<style scoped>
.panel-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
.record-count { font-size: .88rem; color: #64748b; }

.section-title {
  font-size: .95rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 14px;
  padding-bottom: 10px;
  border-bottom: 1px solid #f1f5f9;
}

.empty-hint {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #94a3b8;
  font-size: .9rem;
  gap: 4px;
}

.record-list { display: flex; flex-direction: column; gap: 10px; }

.record-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 14px 16px;
  position: relative;
}

.record-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}
.record-date { font-size: .82rem; font-weight: 600; color: #475569; }
.record-by { font-size: .78rem; color: #94a3b8; }

.record-body { display: flex; flex-direction: column; gap: 6px; }

.record-field { display: flex; gap: 8px; align-items: flex-start; }
.field-label {
  flex: 0 0 36px;
  font-size: .78rem;
  color: #94a3b8;
  font-weight: 600;
  padding-top: 1px;
}
.field-text { font-size: .9rem; color: #334155; line-height: 1.5; flex: 1; white-space: pre-wrap; }

.record-actions { display: flex; gap: 4px; margin-top: 10px; justify-content: flex-end; }

.pager { display: flex; align-items: center; gap: 10px; margin-top: 14px; color: #64748b; font-size: .88rem; }

.mask { position: fixed; inset: 0; background: rgba(0,0,0,.36); display: flex; align-items: center; justify-content: center; z-index: 2000; }
.modal { width: min(560px, 92vw); padding: 20px; }
.modal h4 { margin: 2px 0 14px; font-size: 1rem; color: #1e293b; }
.grid { display: grid; grid-template-columns: 80px 1fr; gap: 10px; align-items: start; }
.grid label { padding-top: 10px; font-size: .9rem; color: #475569; white-space: nowrap; }
.actions { margin-top: 16px; display: flex; justify-content: flex-end; gap: 8px; }
</style>
