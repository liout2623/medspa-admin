<template>
  <div class="health-record-panel card">
    <div class="panel-header">
      <div class="header-left">
        <Activity class="icon" :size="20" />
        <h2>艾灸档案 / 体质记录</h2>
      </div>
      <button class="btn btn-primary btn-sm" @click="handleCreate">
        <Plus :size="16" />
        新增记录
      </button>
    </div>

    <!-- 记录列表区 -->
    <div class="panel-content" v-loading="loading">
      <div v-if="records.length === 0 && !loading" class="empty-state">
        <div class="empty-icon">📝</div>
        <p>暂无健康记录</p>
      </div>

      <div v-else class="record-list">
        <div v-for="record in records" :key="record.id" class="record-card">
          <div class="record-meta">
            <span class="record-date">{{ formatDate(record.recordDate) }}</span>
            <span class="record-author">记录人：{{ record.createdByName }}</span>
            <span class="record-time">{{ formatTime(record.createdAt) }}</span>
          </div>

          <div class="record-body">
            <div class="record-field" v-if="record.assessment">
              <h4>体质评估/症状描述</h4>
              <p>{{ record.assessment }}</p>
            </div>
            <div class="record-field" v-if="record.recommendation">
              <h4>艾灸建议</h4>
              <p>{{ record.recommendation }}</p>
            </div>
          </div>

          <div class="record-actions" v-if="canEditOrDelete(record.createdBy)">
            <button class="btn btn-ghost btn-icon" title="编辑" @click="handleEdit(record)">
              <Edit2 :size="14" />
            </button>
            <button class="btn btn-ghost btn-icon danger" title="删除" @click="handleDelete(record)">
              <Trash2 :size="14" />
            </button>
          </div>
        </div>
      </div>

      <!-- 分页控件 -->
      <div v-if="total > 0" class="pagination">
        <button
          class="btn btn-ghost btn-icon"
          :disabled="currentPage === 1"
          @click="changePage(currentPage - 1)"
        >
          <ChevronLeft :size="16" />
        </button>
        <span class="page-info">第 {{ currentPage }} 页 / 共 {{ totalPages }} 页</span>
        <button
          class="btn btn-ghost btn-icon"
          :disabled="currentPage >= totalPages"
          @click="changePage(currentPage + 1)"
        >
          <ChevronRight :size="16" />
        </button>
      </div>
    </div>

    <!-- 新增/编辑弹窗 -->
    <div v-if="modalVisible" class="modal-mask" @click.self="closeModal">
      <div class="modal">
        <div class="modal-header">
          <h3>{{ editingId ? '编辑记录' : '新增记录' }}</h3>
          <button class="close-btn" @click="closeModal">
            <X :size="20" />
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>记录日期</label>
            <input type="date" v-model="formData.recordDate" class="form-input" />
          </div>
          <div class="form-group">
            <label>体质评估 / 症状描述</label>
            <textarea
              v-model="formData.assessment"
              class="form-input textarea"
              rows="4"
              placeholder="请输入体质评估或症状描述..."
            ></textarea>
          </div>
          <div class="form-group">
            <label>艾灸建议</label>
            <textarea
              v-model="formData.recommendation"
              class="form-input textarea"
              rows="4"
              placeholder="请输入艾灸建议..."
            ></textarea>
          </div>
          <p class="form-hint" v-if="formError">{{ formError }}</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" @click="closeModal">取消</button>
          <button class="btn btn-primary" :disabled="submitting" @click="submitForm">
            {{ submitting ? '保存中...' : '保存' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Activity, Plus, Edit2, Trash2, ChevronLeft, ChevronRight, X } from 'lucide-vue-next'
import { listHealthRecords, createHealthRecord, updateHealthRecord, deleteHealthRecord } from '../../api/customer'
import type { HealthRecordResponse, HealthRecordRequest } from '../../api/customer'
import { useAuthStore } from '../../stores/auth'
import { useUiStore } from '../../stores/ui'

const props = defineProps<{
  customerId: number
}>()

const authStore = useAuthStore()
const uiStore = useUiStore()

const loading = ref(false)
const records = ref<HealthRecordResponse[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(5)

const modalVisible = ref(false)
const submitting = ref(false)
const editingId = ref<number | null>(null)
const formError = ref('')

const formData = ref<HealthRecordRequest>({
  assessment: '',
  recommendation: '',
  recordDate: ''
})

const totalPages = computed(() => Math.ceil(total.value / pageSize.value) || 1)

// 辅助方法
const pad2 = (n: number) => String(n).padStart(2, '0')
const getTodayDateString = () => {
  const d = new Date()
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

const formatDate = (val: string) => {
  if (!val) return ''
  return val.split('T')[0]
}

const formatTime = (val: string) => {
  if (!val) return ''
  const d = new Date(val)
  if (isNaN(d.getTime())) return val
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`
}

// 权限判断
const canEditOrDelete = (createdBy: number) => {
  if (!authStore.user) return false
  return authStore.user.role === 'ADMIN' || authStore.user.id === createdBy
}

// 获取记录列表
const fetchRecords = async () => {
  if (!props.customerId) return
  loading.value = true
  try {
    const res = await listHealthRecords(props.customerId, { page: currentPage.value, size: pageSize.value })
    if (res.data?.success) {
      records.value = res.data.data.items
      total.value = res.data.data.total
    }
  } catch (error: any) {
    if (error.response?.status === 403) {
      uiStore.toast('无权限查看记录', 'error')
    } else {
      uiStore.toast('获取记录失败', 'error')
    }
  } finally {
    loading.value = false
  }
}

const changePage = (page: number) => {
  if (page < 1 || page > totalPages.value) return
  currentPage.value = page
  fetchRecords()
}

// 交互操作
const handleCreate = () => {
  editingId.value = null
  formData.value = {
    assessment: '',
    recommendation: '',
    recordDate: getTodayDateString()
  }
  formError.value = ''
  modalVisible.value = true
}

const handleEdit = (record: HealthRecordResponse) => {
  editingId.value = record.id
  formData.value = {
    assessment: record.assessment || '',
    recommendation: record.recommendation || '',
    recordDate: record.recordDate || getTodayDateString()
  }
  formError.value = ''
  modalVisible.value = true
}

const handleDelete = async (record: HealthRecordResponse) => {
  const confirmed = await uiStore.confirm('删除确认', '确定要删除这条记录吗？')
  if (!confirmed) return
  
  try {
    const res = await deleteHealthRecord(props.customerId, record.id)
    if (res.data?.success) {
      uiStore.toast('删除成功', 'success')
      if (records.value.length === 1 && currentPage.value > 1) {
        currentPage.value--
      }
      fetchRecords()
    }
  } catch (error: any) {
    if (error.response?.status === 403) {
      uiStore.toast('无权限执行该操作', 'error')
    } else {
      uiStore.toast('删除失败', 'error')
    }
  }
}

const closeModal = () => {
  modalVisible.value = false
}

const submitForm = async () => {
  // Frontend validation: At least one of assessment or recommendation is filled
  const hasAssessment = formData.value.assessment?.trim()
  const hasRecommendation = formData.value.recommendation?.trim()
  
  if (!hasAssessment && !hasRecommendation) {
    uiStore.toast('评估或建议至少填写一项', 'error')
    formError.value = '体质评估或艾灸建议至少填写一项'
    return
  }

  // Use today if recordDate is missing somehow
  if (!formData.value.recordDate) {
    formData.value.recordDate = getTodayDateString()
  }

  submitting.value = true
  formError.value = ''

  try {
    let res
    if (editingId.value) {
      res = await updateHealthRecord(props.customerId, editingId.value, formData.value)
    } else {
      res = await createHealthRecord(props.customerId, formData.value)
    }

    if (res.data?.success) {
      uiStore.toast(editingId.value ? '更新成功' : '新增成功', 'success')
      closeModal()
      if (!editingId.value) {
        currentPage.value = 1 // Go to first page on create
      }
      fetchRecords()
    }
  } catch (error: any) {
    if (error.response?.status === 403) {
      uiStore.toast('无权限执行该操作', 'error')
    } else if (error.response?.status === 404) {
      uiStore.toast('客户不存在', 'error')
    } else {
      uiStore.toast(editingId.value ? '更新失败' : '新增失败', 'error')
    }
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  fetchRecords()
})
</script>

<style scoped>
.health-record-panel {
  margin-top: var(--spacing-4);
  background-color: var(--surface-100);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-4) var(--spacing-6);
  border-bottom: 1px solid var(--border-color);
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

.header-left h2 {
  margin: 0;
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--text-100);
}

.header-left .icon {
  color: var(--primary-500);
}

.panel-content {
  padding: var(--spacing-4) var(--spacing-6);
  position: relative;
  min-height: 150px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-8) 0;
  color: var(--text-300);
}

.empty-icon {
  font-size: 2rem;
  margin-bottom: var(--spacing-2);
}

.record-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
}

.record-card {
  position: relative;
  background-color: var(--surface-200);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: var(--spacing-4);
  transition: all 0.2s ease;
}

.record-card:hover {
  border-color: var(--primary-300);
}

.record-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--spacing-3);
  margin-bottom: var(--spacing-3);
  font-size: var(--font-size-sm);
  color: var(--text-300);
}

.record-date {
  font-weight: 600;
  color: var(--primary-600);
  background-color: var(--primary-50);
  padding: 2px 8px;
  border-radius: var(--radius-sm);
}

[data-theme="dark"] .record-date {
  background-color: var(--primary-900);
  color: var(--primary-300);
}

.record-body {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.record-field h4 {
  margin: 0 0 var(--spacing-1) 0;
  font-size: var(--font-size-sm);
  color: var(--text-200);
  font-weight: 600;
}

.record-field p {
  margin: 0;
  font-size: var(--font-size-base);
  color: var(--text-100);
  line-height: 1.5;
  white-space: pre-wrap;
}

.record-actions {
  position: absolute;
  top: var(--spacing-4);
  right: var(--spacing-4);
  display: flex;
  gap: var(--spacing-1);
}

.btn-icon {
  padding: var(--spacing-1);
  color: var(--text-300);
}

.btn-icon:hover {
  background-color: var(--surface-300);
  color: var(--text-100);
}

.btn-icon.danger:hover {
  color: var(--danger-500);
  background-color: var(--danger-50);
}

[data-theme="dark"] .btn-icon.danger:hover {
  background-color: rgba(239, 68, 68, 0.1);
}

/* 分页控件 */
.pagination {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: var(--spacing-4);
  margin-top: var(--spacing-6);
  padding-top: var(--spacing-4);
  border-top: 1px solid var(--border-color);
}

.page-info {
  font-size: var(--font-size-sm);
  color: var(--text-300);
}

/* 弹窗样式 */
.modal-mask {
  position: fixed;
  inset: 0;
  background-color: var(--overlay-bg, rgba(0, 0, 0, 0.5));
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background-color: var(--surface-100);
  border-radius: var(--radius-lg);
  width: 90%;
  max-width: 500px;
  box-shadow: var(--shadow-xl);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: modal-enter 0.2s ease-out;
}

@keyframes modal-enter {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.modal-header {
  padding: var(--spacing-4) var(--spacing-6);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--text-100);
}

.close-btn {
  background: none;
  border: none;
  color: var(--text-300);
  cursor: pointer;
  padding: var(--spacing-1);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  transition: all 0.2s;
}

.close-btn:hover {
  background-color: var(--surface-200);
  color: var(--text-100);
}

.modal-body {
  padding: var(--spacing-6);
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.form-group label {
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--text-200);
}

.form-input {
  width: 100%;
  padding: var(--spacing-2) var(--spacing-3);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background-color: var(--surface-100);
  color: var(--text-100);
  font-size: var(--font-size-base);
  transition: all 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: var(--primary-500);
  box-shadow: 0 0 0 2px var(--primary-100);
}

[data-theme="dark"] .form-input:focus {
  box-shadow: 0 0 0 2px var(--primary-900);
}

.textarea {
  resize: vertical;
  min-height: 80px;
}

.form-hint {
  color: var(--danger-500);
  font-size: var(--font-size-sm);
  margin: 0;
}

.modal-footer {
  padding: var(--spacing-4) var(--spacing-6);
  border-top: 1px solid var(--border-color);
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-3);
  background-color: var(--surface-50);
}

.custom-directives {
  /* This ensures the v-loading directive (if implemented globally) has something to anchor to */
}
</style>
