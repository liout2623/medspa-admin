<template>
  <el-card>
    <el-form inline>
      <el-form-item label="关键词">
        <el-input v-model="keyword" placeholder="姓名/手机号/标签" clearable />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="load">查询</el-button>
      </el-form-item>
    </el-form>

    <el-table :data="list" border>
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="name" label="姓名" />
      <el-table-column prop="phone" label="手机号" />
      <el-table-column prop="tags" label="标签" />
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
import { listCustomers } from '../../api/customer'

const keyword = ref('')
const list = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const size = ref(10)

const load = async () => {
  try {
    const res = await listCustomers({ page: page.value, size: size.value, keyword: keyword.value || undefined })
    list.value = res.data.data.items
    total.value = res.data.data.total
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || '加载客户失败')
  }
}
const onPageChange = (p: number) => {
  page.value = p
  load()
}
onMounted(load)
</script>