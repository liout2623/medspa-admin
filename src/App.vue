<template>
  <RouterView />
  <AppToast />
  <ConfirmModal />
</template>

<script setup lang="ts">
import AppToast from './components/ui/AppToast.vue'
import ConfirmModal from './components/ui/ConfirmModal.vue'
</script>