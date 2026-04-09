<template>
  <el-card>
    <el-form inline>
      <el-form-item label="关键词">
        <el-input v-model="keyword" placeholder="用户名/姓名/手机号" clearable />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="load">查询</el-button>
      </el-form-item>
    </el-form>

    <el-table :data="list" border>
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="username" label="用户名" />
      <el-table-column prop="displayName" label="显示名" />
      <el-table-column prop="role" label="角色" width="120" />
      <el-table-column prop="active" label="状态" width="100">
        <template #default="{ row }">{{ row.active ? '启用' : '停用' }}</template>
      </el-table-column>
    </el-table>

    <el-pagination
      style="margin-top:12px"
      background
      layout="total, prev, pager, next"
      :total="total"
      :page-size="size"
      :current-page="page"
      @current-change="onPageChange"
    />
  </el-card>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { listUsers } from '../../api/user'

const keyword = ref('')
const list = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const size = ref(10)

const load = async () => {
  try {
    const res = await listUsers({ page: page.value, size: size.value, keyword: keyword.value || undefined })
    list.value = res.data.data.items
    total.value = res.data.data.total
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || '加载用户失败')
  }
}
const onPageChange = (p: number) => {
  page.value = p
  load()
}
onMounted(load)
</script>