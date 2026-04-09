<template>
  <section class="card panel">
    <div class="panel-head">
      <h3>客户管理</h3>
      <div style="display:flex;gap:8px">
        <button class="btn btn-ghost" @click="openImport">批量录入</button>
        <button class="btn btn-primary" @click="openCreate">+ 新增客户</button>
      </div>
    </div>

    <div class="toolbar">
      <input class="input" v-model="keyword" placeholder="姓名/手机号/标签" @keyup.enter="onSearch" />
      <button class="btn btn-primary" :disabled="loading" @click="onSearch">{{ loading ? '查询中...' : '查询' }}</button>
      <button class="btn btn-ghost" :disabled="loading" @click="onReset">重置</button>
    </div>

    <table class="tbl">
      <thead><tr><th>ID</th><th>姓名</th><th>手机号</th><th>邮箱</th><th>标签</th><th style="width:180px">操作</th></tr></thead>
      <tbody v-if="list.length">
        <tr v-for="c in list" :key="c.id">
          <td>{{ c.id }}</td><td>{{ c.name }}</td><td>{{ c.phone || '-' }}</td><td>{{ c.email || '-' }}</td><td>{{ c.tags || '-' }}</td>
          <td>
            <button class="btn-mini edit" @click="openEdit(c)">编辑</button>
            <button class="btn-mini del" @click="onDelete(c.id)">删除</button>
          </td>
        </tr>
      </tbody>
      <tbody v-else>
        <tr><td colspan="6" style="text-align:center;color:#94a3b8;padding:28px">暂无数据</td></tr>
      </tbody>
    </table>

    <div class="pager">
      <button class="btn btn-ghost" :disabled="page<=1 || loading" @click="page--;load()">上一页</button>
      <span>第 {{ page }} 页 / 共 {{ totalPage }} 页（总数 {{ total }}）</span>
      <button class="btn btn-ghost" :disabled="page>=totalPage || loading" @click="page++;load()">下一页</button>
    </div>
  </section>

  <div v-if="showModal" class="mask" @click="closeModal">
    <div class="modal card" @click.stop>
      <h4>{{ editingId ? '编辑客户' : '新增客户' }}</h4>
      <div class="grid">
        <label>姓名</label><input class="input" v-model.trim="form.name" />
        <label>手机号</label><input class="input" v-model.trim="form.phone" />
        <label>邮箱</label><input class="input" v-model.trim="form.email" />
        <label>性别</label><input class="input" v-model.trim="form.gender" />
        <label>标签</label><input class="input" v-model.trim="form.tags" />
        <label>生日</label><input class="input" type="date" v-model="form.birthday" />
        <label>备注</label><textarea class="input" rows="3" v-model.trim="form.note"></textarea>
      </div>
      <div class="actions">
        <button class="btn btn-ghost" @click="closeModal">取消</button>
        <button class="btn btn-primary" :disabled="submitting" @click="onSubmit">{{ submitting ? '提交中...' : (editingId ? '保存' : '创建') }}</button>
      </div>
    </div>
  </div>

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
import { useUiStore } from '../../stores/ui'
import { createCustomer, deleteCustomer, importCustomers, listCustomers, updateCustomer } from '../../api/customer'

const ui = useUiStore()
type CustomerRow = { name: string; phone?: string; email?: string; gender?: string; tags?: string; note?: string; birthday?: string }

const list = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const size = ref(10)
const keyword = ref('')
const loading = ref(false)
const submitting = ref(false)
const importing = ref(false)

const totalPage = computed(() => Math.max(1, Math.ceil(total.value / size.value)))
const parseErr = (e: any, fallback: string) => e?.response?.data?.message || fallback

const load = async () => {
  try {
    loading.value = true
    const res = await listCustomers({ page: page.value, size: size.value, keyword: keyword.value || undefined })
    list.value = res.data.data.items || []
    total.value = res.data.data.total || 0
  } catch (e: any) {
    ui.toast(parseErr(e, '加载客户失败'), 'error')
  } finally {
    loading.value = false
  }
}
const onSearch = () => { page.value = 1; load() }
const onReset = () => { keyword.value = ''; page.value = 1; load() }

const showModal = ref(false)
const editingId = ref<number | null>(null)
const form = ref<CustomerRow>({ name: '', phone: '', email: '', gender: '', tags: '', note: '', birthday: '' })

const openCreate = () => { editingId.value = null; form.value = { name: '', phone: '', email: '', gender: '', tags: '', note: '', birthday: '' }; showModal.value = true }
const openEdit = (c: any) => { editingId.value = c.id; form.value = { ...c, birthday: c.birthday || '' }; showModal.value = true }
const closeModal = () => (showModal.value = false)

const onSubmit = async () => {
  if (!form.value.name?.trim()) return ui.toast('姓名不能为空', 'error')
  try {
    submitting.value = true
    const payload = { ...form.value }
    if (editingId.value) await updateCustomer(editingId.value, payload)
    else await createCustomer(payload)
    closeModal()
    await load()
    ui.toast(editingId.value ? '保存成功' : '创建成功', 'success')
  } catch (e: any) {
    ui.toast(parseErr(e, '保存失败'), 'error')
  } finally {
    submitting.value = false
  }
}

const onDelete = async (id: number) => {
  const ok = await ui.confirm('删除确认', '确认删除该客户？')
  if (!ok) return
  try {
    await deleteCustomer(id)
    if (list.value.length === 1 && page.value > 1) page.value--
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

onMounted(load)
</script>

<style scoped>
.panel{padding:16px}
.panel-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}
.toolbar{display:flex;gap:8px;align-items:center;margin-bottom:12px;flex-wrap:wrap}
.pager{display:flex;align-items:center;gap:10px;margin-top:12px}
.btn-mini{border:0;border-radius:8px;padding:6px 10px;cursor:pointer;margin-right:6px}
.btn-mini.edit{background:#eff6ff;color:#2563eb;border:1px solid #bfdbfe}
.btn-mini.del{background:#fff1f2;color:#e11d48;border:1px solid #fecdd3}
.mask{position:fixed;inset:0;background:rgba(0,0,0,.36);display:flex;align-items:center;justify-content:center;z-index:2000}
.modal{padding:18px}
.grid{display:grid;grid-template-columns:140px 1fr;gap:10px;align-items:center}
.actions{margin-top:16px;display:flex;justify-content:flex-end;gap:8px}
</style>