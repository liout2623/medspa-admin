<template>
  <transition name="toast-fade">
    <div v-if="ui.toastVisible" class="toast" :class="ui.toastType">
      {{ ui.toastMessage }}
    </div>
  </transition>
</template>

<script setup lang="ts">
import { useUiStore } from '../../stores/ui'
const ui = useUiStore()
</script>

<style scoped>
.toast{
  position:fixed;top:18px;left:50%;transform:translateX(-50%);
  z-index:4000;padding:10px 14px;border-radius:10px;color:#fff;
  box-shadow:var(--shadow-lg);font-size:.9rem;
}
.success{background:var(--toast-success)}
.error{background:var(--toast-error)}
.info{background:var(--toast-info)}
.toast-fade-enter-active,.toast-fade-leave-active{transition:.2s ease}
.toast-fade-enter-from,.toast-fade-leave-to{opacity:0;transform:translate(-50%,-6px)}
</style>