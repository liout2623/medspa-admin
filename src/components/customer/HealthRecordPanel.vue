<template>
  <div>
    <div class="card panel">
      <div class="panel-head">
        <div class="header-left">
          <Activity :size="18" style="color:var(--brand)" />
          <h2>健康档案 / 体质记录</h2>
        </div>
        <button class="btn btn-primary" @click="handleCreate">
          <Plus :size="16" />
          新增记录
        </button>
      </div>

      <!-- 加载中 -->
      <div v-if="loading" class="loading-state">
        <span>加载中...</span>
      </div>

      <!-- 记录列表区 -->
      <template v-else>
        <div v-if="records.length === 0" class="empty-state">
          <div class="empty-icon">📝</div>
          <p>暂无健康记录</p>
        </div>

        <div v-else class="record-list">
          <div v-for="record in records" :key="record.id" class="record-item">
            <div class="record-meta">
              <span class="record-date">{{ formatDate(record.recordDate) }}</span>
              <span class="record-author">记录人：{{ record.createdByName }}</span>
              <span class="record-time">{{ formatTime(record.createdAt) }}</span>
            </div>

            <div class="record-body">
              <div class="record-field" v-if="record.assessment">
                <h4>体质评估 / 症状描述</h4>
                <p>{{ record.assessment }}</p>
              </div>
              <div class="record-field" v-if="record.recommendation">
                <h4>艾灸建议</h4>
                <p>{{ record.recommendation }}</p>
              </div>
            </div>

            <div class="record-actions" v-if="canEditOrDelete(record.createdBy)">
              <button class="btn-mini edit" title="编辑" @click="handleEdit(record)">
                <Edit2 :size="14" />
              </button>
              <button class="btn-mini del" title="删除" @click="handleDelete(record)">
                <Trash2 :size="14" />
              </button>
            </div>
          </div>
        </div>

        <!-- 分页控件 -->
        <div v-if="total > 0" class="pager">
          <button class="btn btn-ghost" :disabled="currentPage === 1" @click="changePage(currentPage - 1)">上一页</button>
          <span>第 {{ currentPage }} 页 / 共 {{ totalPages }} 页</span>
          <button class="btn btn-ghost" :disabled="currentPage >= totalPages" @click="changePage(currentPage + 1)">下一页</button>
        </div>
      </template>
    </div>

    <!-- 新增/编辑弹窗 -->
    <div v-if="modalVisible" class="mask" @click.self="closeModal">
      <div class="modal card" @click.stop>
        <h4>{{ editingId ? '编辑记录' : '新增记录' }}</h4>
        <div class="form-fields">
          <div class="field-group">
            <label>记录日期</label>
            <input type="date" v-model="formData.recordDate" class="input" />
          </div>
          <div class="field-group">
            <label>体质评估 / 症状描述</label>
            <textarea
              v-model="formData.assessment"
              rows="3"
              class="input"
              placeholder="请输入体质评估或症状描述..."
            ></textarea>
          </div>
          <div class="field-group">
            <label>艾灸建议</label>
            <textarea
              v-model="formData.recommendation"
              rows="3"
              class="input"
              placeholder="请输入艾灸建议..."
            ></textarea>
          </div>
        </div>
        <p v-if="formError" class="form-error">{{ formError }}</p>
        <div class="actions">
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
import { Activity, Plus, Edit2, Trash2 } from 'lucide-vue-next'
import { listHealthRecords, createHealthRecord, updateHealthRecord, deleteHealthRecord } from '../../api/health-record'
import type { HealthRecordResponse, HealthRecordRequest } from '../../types/health-record'
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
  const hasAssessment = formData.value.assessment?.trim()
  const hasRecommendation = formData.value.recommendation?.trim()

  if (!hasAssessment && !hasRecommendation) {
    uiStore.toast('评估或建议至少填写一项', 'error')
    formError.value = '体质评估或艾灸建议至少填写一项'
    return
  }

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
        currentPage.value = 1
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
.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-left h2 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-strong);
}

/* Loading */
.loading-state {
  text-align: center;
  padding: 40px 0;
  color: var(--text-muted);
  font-size: 0.9rem;
}

/* Empty */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
  color: var(--text-muted);
}

.empty-icon {
  font-size: 2rem;
  margin-bottom: 8px;
}

.empty-state p {
  margin: 0;
  font-size: 0.9rem;
}

/* Record list */
.record-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.record-item {
  position: relative;
  background: var(--bg-subtle);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 14px 16px;
  transition: border-color 0.2s ease;
}

.record-item:hover {
  border-color: var(--border-strong);
}

.record-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 10px;
  font-size: 0.8rem;
  color: var(--text-muted);
}

.record-date {
  font-weight: 600;
  color: var(--brand-dark);
  background: var(--brand-bg);
  padding: 2px 8px;
  border-radius: 6px;
}

.record-author,
.record-time {
  color: var(--text-muted);
}

.record-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.record-field h4 {
  margin: 0 0 4px 0;
  font-size: 0.8rem;
  color: var(--text-muted);
  font-weight: 600;
}

.record-field p {
  margin: 0;
  font-size: 0.9rem;
  color: var(--text);
  line-height: 1.6;
  white-space: pre-wrap;
}

.record-actions {
  position: absolute;
  top: 14px;
  right: 16px;
  display: flex;
  gap: 4px;
}

/* Pager — inherit from global */

/* Modal */
.mask{position:fixed;inset:0;background:var(--overlay);display:flex;align-items:center;justify-content:center;z-index:2000}
.modal{width:min(520px,92vw);padding:18px}

.form-fields {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-top: 14px;
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-group label {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--text-muted);
}

.form-error {
  color: var(--toast-error);
  font-size: 0.85rem;
  margin: 8px 0 0;
}

/* Dark mode */
html.dark .record-date {
  color: var(--brand-light);
  background: var(--brand-bg);
}
</style>
