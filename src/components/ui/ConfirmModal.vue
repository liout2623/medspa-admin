<template>
  <div v-if="ui.confirmVisible" class="mask" @click="ui.resolveConfirm(false)">
    <div class="modal card" @click.stop>
      <h4>{{ ui.confirmTitle }}</h4>
      <p class="msg">{{ ui.confirmMessage }}</p>
      <div class="actions">
        <button class="btn btn-ghost" :disabled="ui.confirmLoading" @click="ui.resolveConfirm(false)">取消</button>
        <button class="btn btn-primary" :disabled="ui.confirmLoading" @click="ui.resolveConfirm(true)">确定</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useUiStore } from '../../stores/ui'
const ui = useUiStore()
</script>

<style scoped>
.msg{color:#475569;margin:6px 0 0}
.mask{position:fixed;inset:0;background:rgba(0,0,0,.36);display:flex;align-items:center;justify-content:center;z-index:3500}
.modal{width:min(420px,92vw);padding:18px}
.actions{margin-top:16px;display:flex;justify-content:flex-end;gap:8px}
</style>