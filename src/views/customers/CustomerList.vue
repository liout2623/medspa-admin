<template>
  <section class="card panel">
    <div class="panel-head">
      <div style="display:flex;gap:8px">
        <button class="btn btn-ghost" :disabled="exporting" @click="onExport">
          <Download :size="16" />
          {{ exporting ? '导出中...' : '导出数据' }}
        </button>
        <button class="btn btn-ghost" @click="openImport">
          <FileUp :size="16" />
          批量录入
        </button>
        <button class="btn btn-primary" @click="openCreate">
          <Plus :size="16" />
          新增客户
        </button>
      </div>
    </div>

    <div class="toolbar">
      <div style="flex:1; max-width:320px; position:relative">
        <Search class="search-icon" :size="16" />
        <input class="input" style="padding-left:36px" v-model="keyword" placeholder="姓名/手机号/标签" @keyup.enter="onSearch" />
      </div>
      <button class="btn btn-primary" :disabled="loading" @click="onSearch">查询</button>
      <button class="btn btn-ghost" :disabled="loading" @click="onReset">
        <RotateCcw :size="16" />
        重置
      </button>
    </div>

    <div v-if="tagCloud.length" class="tag-cloud-wrap">
      <div class="tag-cloud-head">
        <div class="tag-cloud-title-wrap">
          <span class="tag-cloud-title">标签云快捷筛选</span>
          <span v-if="activeTag" class="tag-selected">已选：{{ activeTag }}</span>
        </div>
        <button v-if="activeTag" class="btn btn-ghost btn-clear-tag" @click="clearTagFilter">清空标签</button>
      </div>
      <div class="tag-cloud-list">
        <button
          v-for="tag in tagCloud"
          :key="tag.name"
          class="tag-pill"
          :class="{ active: activeTag === tag.name }"
          @click="toggleTag(tag.name)"
        >
          <span>{{ tag.name }}</span>
          <span class="tag-count">{{ tag.count }}</span>
        </button>
      </div>
    </div>

    <table class="tbl">
      <thead><tr><th>ID</th><th>姓名</th><th>手机号</th><th>邮箱</th><th>标签</th><th style="width:180px">操作</th></tr></thead>
      <tbody v-if="displayList.length">
        <tr v-for="c in displayList" :key="c.id">
          <td>{{ c.id }}</td>
          <td>
            <div class="name-cell">
              <button class="name-link" @click="openDetail(c.id)">{{ c.name || '—' }}</button>
              <button class="view-detail-btn" @click="openDetail(c.id)">查看详情</button>
            </div>
          </td>
          <td>{{ c.phone || '-' }}</td><td>{{ c.email || '-' }}</td><td>{{ c.tags || '-' }}</td>
          <td>
            <button class="btn-mini view" @click="router.push(`/customers/${c.id}`)" title="查看详情">
              <Eye :size="14" />
            </button>
            <button class="btn-mini edit" @click="openEdit(c)" title="编辑">
              <Edit2 :size="14" />
            </button>
            <button class="btn-mini del" @click="onDelete(c.id)" title="删除">
              <Trash2 :size="14" />
            </button>
          </td>
        </tr>
      </tbody>
      <tbody v-else>
        <tr><td colspan="6" style="text-align:center;color:#94a3b8;padding:40px">
          <div style="display:flex;flex-direction:column;align-items:center;gap:12px">
            <Search :size="32" style="color:#cbd5e1" />
            <span>{{ activeTag ? '当前页无匹配客户' : '暂无数据' }}</span>
          </div>
        </td></tr>
      </tbody>
    </table>

    <div class="pager">
      <button class="btn btn-ghost" :disabled="page<=1 || loading" @click="prevPage">上一页</button>
      <span>第 {{ page }} 页 / 共 {{ totalPage }} 页（总数 {{ total }}）</span>
      <button class="btn btn-ghost" :disabled="page>=totalPage || loading" @click="nextPage">下一页</button>
    </div>
  </section>

  <CustomerFormModal
    v-model:visible="formVisible"
    :editingCustomer="selectedCustomer"
    @saved="handleSaved"
  />

  <div v-if="showImport" class="mask" @click="closeImport">
    <div class="modal card" style="width:min(1000px,96vw)" @click.stop>
      <h4>批量录入客户</h4>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <div style="font-size:13px;color:#64748b">至少填写姓名；建议填写手机号便于去重</div>
        <button class="btn btn-ghost" @click="addImportRow">+ 添加一行</button>
      </div>

      <div style="max-height:50vh;overflow:auto;border:1px solid #e5e7eb;border-radius:10px">
        <table class="tbl" style="min-width:920px">
          <thead>
            <tr><th style="width:60px">#</th><th>姓名*</th><th>手机号</th><th>邮箱</th><th>性别</th><th>标签</th><th>生日</th><th>备注</th><th style="width:90px">操作</th></tr>
          </thead>
          <tbody>
            <tr v-for="(r, idx) in importRows" :key="idx">
              <td>{{ idx + 1 }}</td>
              <td><input class="input" v-model.trim="r.name" placeholder="姓名" /></td>
              <td><input class="input" v-model.trim="r.phone" placeholder="手机号" /></td>
              <td><input class="input" v-model.trim="r.email" placeholder="邮箱" /></td>
              <td><input class="input" v-model.trim="r.gender" placeholder="男/女" /></td>
              <td><input class="input" v-model.trim="r.tags" placeholder="逗号分隔标签" /></td>
              <td><input class="input" type="date" v-model="r.birthday" /></td>
              <td><input class="input" v-model.trim="r.note" placeholder="备注" /></td>
              <td><button class="btn-mini del" @click="removeImportRow(idx)">删除</button></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="actions">
        <button class="btn btn-ghost" @click="closeImport">取消</button>
        <button class="btn btn-primary" :disabled="importing" @click="submitImport">{{ importing ? '导入中...' : '提交批量录入' }}</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Download, FileUp, Plus, Search, RotateCcw, Edit2, Trash2 } from 'lucide-vue-next'
import { useRoute, useRouter } from 'vue-router'
import { useUiStore } from '../../stores/ui'
import { deleteCustomer, importCustomers, listCustomers, exportCustomers } from '../../api/customer'
import CustomerFormModal from '../../components/customer/CustomerFormModal.vue'

const ui = useUiStore()
const router = useRouter()
const route = useRoute()
type CustomerRow = { name: string; phone?: string; email?: string; gender?: string; tags?: string; note?: string; birthday?: string }

const list = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const size = ref(10)
const keyword = ref('')
const activeTag = ref('')
const loading = ref(false)
const importing = ref(false)
const exporting = ref(false)
const formVisible = ref(false)
const selectedCustomer = ref<any | null>(null)

const totalPage = computed(() => Math.max(1, Math.ceil(total.value / size.value)))
const parseErr = (e: any, fallback: string) => e?.response?.data?.message || fallback

const hydrateFromQuery = () => {
  const keywordQuery = typeof route.query.keyword === 'string' ? route.query.keyword : ''
  const pageQuery = Number(route.query.page)
  const sizeQuery = Number(route.query.size)
  keyword.value = keywordQuery
  page.value = Number.isFinite(pageQuery) && pageQuery > 0 ? pageQuery : 1
  size.value = Number.isFinite(sizeQuery) && sizeQuery > 0 ? sizeQuery : 10
}

const syncQuery = async () => {
  await router.replace({
    name: 'customers',
    query: {
      ...(keyword.value ? { keyword: keyword.value } : {}),
      ...(page.value > 1 ? { page: String(page.value) } : {}),
      ...(size.value !== 10 ? { size: String(size.value) } : {})
    }
  })
}

const normalizeTags = (raw?: string) => {
  if (!raw) return [] as string[]
  return raw
    .split(/[,，]/)
    .map(t => t.trim())
    .filter(Boolean)
}

const tagCloud = computed(() => {
  const counter = new Map<string, number>()
  for (const item of list.value) {
    for (const tag of normalizeTags(item.tags)) {
      counter.set(tag, (counter.get(tag) || 0) + 1)
    }
  }
  return Array.from(counter.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'zh-CN'))
})

const displayList = computed(() => {
  if (!activeTag.value) return list.value
  return list.value.filter(item => normalizeTags(item.tags).includes(activeTag.value))
})

const toggleTag = (tag: string) => {
  activeTag.value = activeTag.value === tag ? '' : tag
}

const clearTagFilter = () => {
  activeTag.value = ''
}

const openDetail = (id: number) => {
  router.push({ name: 'customerDetail', params: { id } })
}

const load = async () => {
  try {
    loading.value = true
    const res = await listCustomers({ page: page.value, size: size.value, keyword: keyword.value || undefined, sort: 'id,asc' })
    list.value = res.data.data.items || []
    total.value = res.data.data.total || 0
  } catch (e: any) {
    ui.toast(parseErr(e, '加载客户失败'), 'error')
  } finally {
    loading.value = false
  }
}
const onSearch = async () => {
  page.value = 1
  await syncQuery()
  await load()
}
const onReset = () => {
  keyword.value = ''
  activeTag.value = ''
  page.value = 1
  void syncQuery()
  load()
}

const prevPage = async () => {
  if (page.value <= 1 || loading.value) return
  page.value--
  await syncQuery()
  await load()
}

const nextPage = async () => {
  if (page.value >= totalPage.value || loading.value) return
  page.value++
  await syncQuery()
  await load()
}

const onExport = async () => {
  if (exporting.value) return
  try {
    exporting.value = true
    const res = await exportCustomers({ keyword: keyword.value || undefined })
    const url = window.URL.createObjectURL(new Blob([res.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', '客户档案.xlsx')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    ui.toast('导出成功', 'success')
  } catch (e: any) {
    ui.toast(parseErr(e, '导出失败，请稍后重试'), 'error')
  } finally {
    exporting.value = false
  }
}

const openCreate = () => { selectedCustomer.value = null; formVisible.value = true }
const openEdit = (c: any) => { selectedCustomer.value = c; formVisible.value = true }
const handleSaved = async () => {
  await load()
}

const onDelete = async (id: number) => {
  const ok = await ui.confirm('删除确认', '确认删除该客户？')
  if (!ok) return
  try {
    await deleteCustomer(id)
    if (list.value.length === 1 && page.value > 1) page.value--
    await syncQuery()
    await load()
    ui.toast('删除成功', 'success')
  } catch (e: any) {
    ui.toast(parseErr(e, '删除失败'), 'error')
  }
}

// 批量录入
const showImport = ref(false)
const importRows = ref<CustomerRow[]>([])
const blankRow = (): CustomerRow => ({ name: '', phone: '', email: '', gender: '', tags: '', note: '', birthday: '' })

const openImport = () => { importRows.value = [blankRow(), blankRow(), blankRow()]; showImport.value = true }
const closeImport = () => (showImport.value = false)
const addImportRow = () => importRows.value.push(blankRow())
const removeImportRow = (idx: number) => {
  importRows.value.splice(idx, 1)
  if (importRows.value.length === 0) importRows.value.push(blankRow())
}

const submitImport = async () => {
  const customers = importRows.value
    .map(r => ({
      name: (r.name || '').trim(),
      phone: r.phone?.trim() || undefined,
      email: r.email?.trim() || undefined,
      gender: r.gender?.trim() || undefined,
      tags: r.tags?.trim() || undefined,
      note: r.note?.trim() || undefined,
      birthday: r.birthday || undefined
    }))
    .filter(r => r.name)

  if (customers.length === 0) return ui.toast('请至少填写一条有效客户（姓名必填）', 'error')

  try {
    importing.value = true
    await importCustomers({ customers })
    closeImport()
    await load()
    ui.toast(`批量导入成功：${customers.length} 条`, 'success')
  } catch (e: any) {
    ui.toast(parseErr(e, '批量导入失败'), 'error')
  } finally {
    importing.value = false
  }
}

onMounted(async () => {
  hydrateFromQuery()
  await load()
})
</script>

<style scoped>
.panel{padding:16px}
.panel-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}
.toolbar{display:flex;gap:8px;align-items:center;margin-bottom:16px;padding-bottom:16px;border-bottom:1px solid var(--border);flex-wrap:wrap}
.tag-cloud-wrap{margin:0 0 14px}
.tag-cloud-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}
.tag-cloud-title-wrap{display:flex;align-items:center;gap:8px;min-width:0}
.tag-cloud-title{font-size:13px;font-weight:600;color:var(--text-muted)}
.tag-selected{font-size:12px;color:var(--brand);background:rgba(15,118,110,.1);border:1px solid rgba(15,118,110,.2);border-radius:999px;padding:2px 10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:220px}
.btn-clear-tag{padding:4px 10px;font-size:12px}
.tag-cloud-list{display:flex;gap:8px;flex-wrap:wrap}
.tag-pill{border:1px solid rgba(15,118,110,.18);background:rgba(15,118,110,.08);color:var(--brand-dark);border-radius:999px;padding:4px 12px;font-size:12px;display:inline-flex;align-items:center;gap:6px;cursor:pointer;transition:all .2s ease}
.tag-pill:hover{background:rgba(15,118,110,.14);border-color:rgba(15,118,110,.26)}
.tag-pill.active{background:linear-gradient(135deg,var(--brand),var(--brand-end));color:#fff;border-color:transparent;box-shadow:0 6px 16px rgba(15,118,110,.25)}
.tag-count{font-size:11px;opacity:.85}
.search-icon { position:absolute; left:12px; top:50%; transform:translateY(-50%); color:var(--text-muted); }
.pager{display:flex;align-items:center;gap:10px;margin-top:12px}
.btn-mini{border:0;border-radius:8px;padding:6px;cursor:pointer;margin-right:6px;display:inline-flex;align-items:center;justify-content:center}
.btn-mini.edit{background:rgba(37,99,235,.12);color:#2563eb;border:1px solid rgba(37,99,235,.22)}
.btn-mini.del{background:rgba(225,29,72,.10);color:#e11d48;border:1px solid rgba(225,29,72,.18)}
.name-cell{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.name-link{border:0;background:transparent;color:var(--brand);font-weight:600;cursor:pointer;padding:0;text-align:left}
.name-link:hover{text-decoration:underline}
.view-detail-btn{border:1px solid rgba(15,118,110,.18);background:rgba(15,118,110,.08);color:var(--brand-dark);border-radius:999px;padding:3px 10px;font-size:12px;cursor:pointer}
.view-detail-btn:hover{background:rgba(15,118,110,.14)}
html.dark .tag-pill{border-color:rgba(20,184,166,.28);background:rgba(20,184,166,.14);color:#7de6d8}
html.dark .tag-pill:hover{background:rgba(20,184,166,.2);border-color:rgba(45,212,191,.4)}
html.dark .tag-selected{color:#7de6d8;background:rgba(20,184,166,.16);border-color:rgba(20,184,166,.3)}
html.dark .view-detail-btn{border-color:rgba(20,184,166,.28);background:rgba(20,184,166,.14);color:#7de6d8}
html.dark .view-detail-btn:hover{background:rgba(20,184,166,.2)}
</style>