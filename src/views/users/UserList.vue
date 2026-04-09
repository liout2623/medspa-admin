<template>
  <section class="card panel">
    <div class="panel-head">
      <h3>用户管理</h3>
      <button class="btn btn-primary" @click="openCreate">+ 新增用户</button>
    </div>

    <div class="toolbar">
      <input class="input" v-model="keyword" placeholder="用户名/姓名/手机号" @keyup.enter="onSearch" />
      <select class="select" v-model="role">
        <option value="">全部角色</option>
        <option value="ADMIN">管理员</option>
        <option value="STAFF">员工</option>
      </select>
      <select class="select" v-model="activeText">
        <option value="">全部状态</option>
        <option value="true">启用</option>
        <option value="false">停用</option>
      </select>
      <button class="btn btn-primary" :disabled="loading" @click="onSearch">{{ loading ? '查询中...' : '查询' }}</button>
      <button class="btn btn-ghost" :disabled="loading" @click="onReset">重置</button>
    </div>

    <table class="tbl">
      <thead>
        <tr>
          <th>ID</th><th>用户名</th><th>显示名</th><th>角色</th><th>手机号</th><th>状态</th><th style="width:180px">操作</th>
        </tr>
      </thead>
      <tbody v-if="list.length">
        <tr v-for="u in list" :key="u.id">
          <td>{{ u.id }}</td>
          <td>{{ u.username }}</td>
          <td>{{ u.displayName }}</td>
          <td>
            <span class="badge" :class="u.role === 'ADMIN' ? 'badge-admin' : 'badge-staff'">
              {{ roleText(u.role) }}
            </span>
          </td>
          <td>{{ u.phone || '-' }}</td>
          <td><span class="badge" :class="u.active ? 'badge-on' : 'badge-off'">{{ u.active ? '启用' : '停用' }}</span></td>
          <td>
            <button class="btn-mini edit" @click="openEdit(u)">编辑</button>
            <button class="btn-mini del" @click="onDelete(u.id)">删除</button>
          </td>
        </tr>
      </tbody>
      <tbody v-else>
        <tr><td colspan="7" style="text-align:center;color:#94a3b8;padding:28px">暂无数据</td></tr>
      </tbody>
    </table>

    <div class="pager">
      <button class="btn btn-ghost" :disabled="page <= 1 || loading" @click="page--; load()">上一页</button>
      <span>第 {{ page }} 页 / 共 {{ totalPage }} 页（总数 {{ total }}）</span>
      <button class="btn btn-ghost" :disabled="page >= totalPage || loading" @click="page++; load()">下一页</button>
    </div>
  </section>

  <div v-if="showModal" class="mask" @click="closeModal">
    <div class="modal card" @click.stop>
      <h4>{{ editingId ? '编辑用户' : '新增用户' }}</h4>
      <div class="grid">
        <label>用户名</label><input class="input" v-model.trim="form.username" :disabled="!!editingId" />
        <label>密码{{ editingId ? '（留空不修改）' : '' }}</label><input class="input" type="password" v-model="form.password" />
        <label>显示名</label><input class="input" v-model.trim="form.displayName" />
        <label>角色</label>
        <select class="select" v-model="form.role">
          <option value="ADMIN">管理员</option>
          <option value="STAFF">员工</option>
        </select>
        <label>手机号</label><input class="input" v-model.trim="form.phone" />
        <label>状态</label>
        <select class="select" v-model="form.activeText">
          <option value="true">启用</option>
          <option value="false">停用</option>
        </select>
      </div>
      <div class="actions">
        <button class="btn btn-ghost" @click="closeModal">取消</button>
        <button class="btn btn-primary" :disabled="submitting" @click="onSubmit">
          {{ submitting ? '提交中...' : (editingId ? '保存' : '创建') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useUiStore } from '../../stores/ui'
import { createUser, deleteUser, listUsers, updateUser } from '../../api/user'

const ui = useUiStore()
const list = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const size = ref(10)
const keyword = ref('')
const role = ref('')
const activeText = ref('')
const loading = ref(false)
const submitting = ref(false)

const totalPage = computed(() => Math.max(1, Math.ceil(total.value / size.value)))
const parseErr = (e: any, fallback: string) => e?.response?.data?.message || fallback
const roleText = (r: string) => (r === 'ADMIN' ? '管理员' : '员工')

const load = async () => {
  try {
    loading.value = true
    const active = activeText.value === '' ? undefined : activeText.value === 'true'
    const res = await listUsers({
      page: page.value,
      size: size.value,
      keyword: keyword.value || undefined,
      role: role.value || undefined,
      active
    })
    list.value = res.data.data.items || []
    total.value = res.data.data.total || 0
  } catch (e: any) {
    ui.toast(parseErr(e, '加载用户失败'), 'error')
  } finally {
    loading.value = false
  }
}

const onSearch = () => { page.value = 1; load() }
const onReset = () => { keyword.value = ''; role.value = ''; activeText.value = ''; page.value = 1; load() }

const showModal = ref(false)
const editingId = ref<number | null>(null)
const form = ref<any>({
  username: '',
  password: '',
  displayName: '',
  role: 'STAFF',
  phone: '',
  activeText: 'true'
})

const openCreate = () => {
  editingId.value = null
  form.value = { username: '', password: '', displayName: '', role: 'STAFF', phone: '', activeText: 'true' }
  showModal.value = true
}
const openEdit = (u: any) => {
  editingId.value = u.id
  form.value = {
    username: u.username,
    password: '',
    displayName: u.displayName,
    role: u.role || 'STAFF',
    phone: u.phone || '',
    activeText: String(!!u.active)
  }
  showModal.value = true
}
const closeModal = () => { showModal.value = false }

const onSubmit = async () => {
  if (!form.value.username?.trim()) return ui.toast('用户名不能为空', 'error')
  if (!form.value.displayName?.trim()) return ui.toast('显示名不能为空', 'error')
  if (!editingId.value && !form.value.password) return ui.toast('新增用户时密码不能为空', 'error')

  try {
    submitting.value = true
    const payload: any = {
      username: form.value.username.trim(),
      role: form.value.role,
      displayName: form.value.displayName.trim(),
      phone: form.value.phone?.trim() || undefined,
      active: form.value.activeText === 'true'
    }
    if (!editingId.value || form.value.password) payload.password = form.value.password

    if (editingId.value) await updateUser(editingId.value, payload)
    else await createUser(payload)

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
  const ok = await ui.confirm('删除确认', '确认删除该用户？')
  if (!ok) return
  try {
    await deleteUser(id)
    if (list.value.length === 1 && page.value > 1) page.value--
    await load()
    ui.toast('删除成功', 'success')
  } catch (e: any) {
    ui.toast(parseErr(e, '删除失败'), 'error')
  }
}

onMounted(load)
</script>

<style scoped>
.panel{padding:16px}
.panel-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}
.toolbar{display:grid;grid-template-columns:minmax(220px,1fr) 160px 160px auto auto;gap:8px;align-items:center;margin-bottom:12px}
.pager{display:flex;align-items:center;gap:10px;margin-top:12px}
.btn-mini{border:0;border-radius:8px;padding:6px 10px;cursor:pointer;margin-right:6px}
.btn-mini.edit{background:#eff6ff;color:#2563eb;border:1px solid #bfdbfe}
.btn-mini.del{background:#fff1f2;color:#e11d48;border:1px solid #fecdd3}
.mask{position:fixed;inset:0;background:rgba(0,0,0,.36);display:flex;align-items:center;justify-content:center;z-index:2000}
.modal{padding:18px}
.grid{display:grid;grid-template-columns:140px 1fr;gap:10px;align-items:center}
.actions{margin-top:16px;display:flex;justify-content:flex-end;gap:8px}
@media (max-width: 980px){ .toolbar{grid-template-columns:1fr 1fr} }
</style>