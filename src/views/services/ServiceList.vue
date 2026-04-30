<template>
  <section class="card panel">
    <div class="panel-head">
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button v-if="isAdmin" class="btn btn-primary" @click="openCreate">
          <Plus :size="16" />
          新增服务项目
        </button>
      </div>
    </div>

    <div class="toolbar">
      <div style="flex:1; max-width:320px; position:relative">
        <Search class="search-icon" :size="16" />
        <input
          class="input"
          style="padding-left:36px"
          v-model="keyword"
          placeholder="名称/描述"
          @keyup.enter="onSearch"
        />
      </div>
      <select class="select" style="max-width:120px" v-model="activeFilter" @change="onSearch">
        <option value="">全部状态</option>
        <option value="true">启用</option>
        <option value="false">停用</option>
      </select>
      <button class="btn btn-primary" :disabled="loading" @click="onSearch">查询</button>
      <button class="btn btn-ghost" :disabled="loading" @click="onReset">
        <RotateCcw :size="16" />
        重置
      </button>
    </div>

    <table class="tbl">
      <thead>
        <tr>
          <th style="width:90px">ID</th>
          <th>项目名称</th>
          <th style="width:140px">价格</th>
          <th style="width:140px">预估时长</th>
          <th style="width:120px">启用状态</th>
          <th v-if="isAdmin" style="width:220px">操作</th>
        </tr>
      </thead>
      <tbody v-if="displayList.length">
        <tr v-for="item in displayList" :key="item.id">
          <td>{{ item.id }}</td>
          <td>
            <div class="name-cell">
              <span class="service-name">{{ item.name || '—' }}</span>
              <span class="service-desc">{{ item.description || '—' }}</span>
            </div>
          </td>
          <td class="num-cell">{{ formatPrice(item.price) }}</td>
          <td class="num-cell">{{ formatDuration(item.durationMinutes) }}</td>
          <td>
            <span class="badge" :class="item.active ? 'badge-on' : 'badge-off'">
              {{ item.active ? '启用' : '停用' }}
            </span>
          </td>
          <td v-if="isAdmin">
            <button class="btn-mini edit" @click="openEdit(item)" title="编辑">
              <Edit2 :size="14" />
            </button>
            <button class="btn-mini del" @click="onDelete(item)" title="删除">
              <Trash2 :size="14" />
            </button>
            <button class="btn-mini toggle" @click="onToggle(item)" :title="item.active ? '停用' : '启用'">
              <component :is="item.active ? ToggleRight : ToggleLeft" :size="14" />
              <span>{{ item.active ? '停用' : '启用' }}</span>
            </button>
          </td>
        </tr>
      </tbody>
      <tbody v-else>
        <tr>
          <td :colspan="isAdmin ? 6 : 5" style="text-align:center;color:#94a3b8;padding:40px">
            <div style="display:flex;flex-direction:column;align-items:center;gap:12px">
              <Search :size="32" style="color:#cbd5e1" />
              <span>{{ loading ? '加载中...' : '暂无数据' }}</span>
            </div>
          </td>
        </tr>
      </tbody>
    </table>

    <div class="pager">
      <button class="btn btn-ghost" :disabled="page <= 1 || loading" @click="prevPage">上一页</button>
      <span>第 {{ page }} 页 / 共 {{ totalPage }} 页（总数 {{ total }}）</span>
      <button class="btn btn-ghost" :disabled="page >= totalPage || loading" @click="nextPage">下一页</button>
    </div>
  </section>

  <ServiceFormModal
    v-model:visible="formVisible"
    :editingService="selectedService"
    @saved="handleSaved"
  />
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Plus, Search, RotateCcw, Edit2, Trash2, ToggleLeft, ToggleRight } from 'lucide-vue-next'
import { useAuthStore } from '../../stores/auth'
import { useUiStore } from '../../stores/ui'
import { deleteService, listServices, toggleServiceStatus } from '../../api/service'
import ServiceFormModal from '../../components/service/ServiceFormModal.vue'

const auth = useAuthStore()
const ui = useUiStore()
const isAdmin = computed(() => auth.user?.role === 'ADMIN')

type ServiceRow = {
  id: number
  name?: string
  description?: string
  price?: number
  durationMinutes?: number
  active?: boolean
}

const list = ref<ServiceRow[]>([])
const total = ref(0)
const page = ref(1)
const size = ref(10)
const keyword = ref('')
const activeFilter = ref('')
const loading = ref(false)
const formVisible = ref(false)
const selectedService = ref<ServiceRow | null>(null)

const totalPage = computed(() => Math.max(1, Math.ceil(total.value / size.value)))
const displayList = computed(() => list.value)
const parseErr = (e: any, fallback: string) => {
  if (e?.response?.status === 403) return '无权限执行该操作'
  return e?.response?.data?.message || fallback
}

const load = async () => {
  try {
    loading.value = true
    const active = activeFilter.value === '' ? undefined : activeFilter.value === 'true'
    const res = await listServices({
      page: page.value,
      size: size.value,
      keyword: keyword.value || undefined,
      active,
      sort: 'id,asc'
    })
    list.value = res.data.data.items || []
    total.value = res.data.data.total || 0
  } catch (e: any) {
    ui.toast(parseErr(e, '加载服务项目失败'), 'error')
  } finally {
    loading.value = false
  }
}

const onSearch = async () => {
  page.value = 1
  await load()
}

const onReset = async () => {
  keyword.value = ''
  activeFilter.value = ''
  page.value = 1
  await load()
}

const prevPage = async () => {
  if (page.value <= 1 || loading.value) return
  page.value--
  await load()
}

const nextPage = async () => {
  if (page.value >= totalPage.value || loading.value) return
  page.value++
  await load()
}

const openCreate = () => {
  if (!isAdmin.value) {
    ui.toast('无权限执行该操作', 'error')
    return
  }
  selectedService.value = null
  formVisible.value = true
}

const openEdit = (item: ServiceRow) => {
  if (!isAdmin.value) {
    ui.toast('无权限执行该操作', 'error')
    return
  }
  selectedService.value = { ...item }
  formVisible.value = true
}

const handleSaved = async () => {
  await load()
}

const onDelete = async (item: ServiceRow) => {
  if (!isAdmin.value) {
    ui.toast('无权限执行该操作', 'error')
    return
  }
  const ok = await ui.confirm('删除确认', `确认删除服务项目“${item.name || item.id}”？`)
  if (!ok) return
  try {
    await deleteService(item.id)
    if (list.value.length === 1 && page.value > 1) page.value--
    await load()
    ui.toast('删除成功', 'success')
  } catch (e: any) {
    ui.toast(parseErr(e, '删除失败'), 'error')
  }
}

const onToggle = async (item: ServiceRow) => {
  if (!isAdmin.value) {
    ui.toast('无权限执行该操作', 'error')
    return
  }
  try {
    await toggleServiceStatus(item.id)
    await load()
    ui.toast(item.active ? '已停用' : '已启用', 'success')
  } catch (e: any) {
    ui.toast(parseErr(e, '状态切换失败'), 'error')
  }
}

const formatPrice = (value?: number) => {
  if (value === null || value === undefined || value === ('' as any)) return '-'
  const num = Number(value)
  if (!Number.isFinite(num)) return '-'
  return `¥${num.toFixed(2)}`
}

const formatDuration = (value?: number) => {
  if (value === null || value === undefined || value === ('' as any)) return '-'
  const num = Number(value)
  if (!Number.isFinite(num)) return '-'
  return `${num} 分钟`
}

onMounted(load)
</script>

<style scoped>
.name-cell{display:flex;flex-direction:column;gap:4px}
.service-name{font-weight:600;color:var(--text-strong)}
.service-desc{font-size:12px;color:var(--text-muted);line-height:1.4;max-width:520px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.num-cell{font-variant-numeric:tabular-nums;text-align:left}
.search-icon { position:absolute; left:12px; top:50%; transform:translateY(-50%); color:var(--text-muted); }
.btn-mini{display:inline-flex;align-items:center;gap:6px}
.btn-mini.toggle{background:rgba(15,118,110,.08);color:var(--brand-dark);border:1px solid rgba(15,118,110,.18)}
.btn-mini.toggle:hover{background:rgba(15,118,110,.14)}
html.dark .btn-mini.toggle{background:rgba(20,184,166,.14);color:#7de6d8;border-color:rgba(20,184,166,.28)}
html.dark .btn-mini.toggle:hover{background:rgba(20,184,166,.2)}
@media (max-width: 860px){
  .service-desc{max-width:320px}
}
</style>
