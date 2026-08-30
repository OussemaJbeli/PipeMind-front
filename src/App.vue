<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

import AuthLayout from '@/layouts/AuthLayout.vue'
import BlankLayout from '@/layouts/BlankLayout.vue'
import WorkspaceLayout from '@/layouts/WorkspaceLayout.vue'

const route = useRoute()

const layout = computed(() => {
  switch (route.meta.layout) {
    case 'auth': return AuthLayout
    case 'workspace':
    case 'project': return WorkspaceLayout
    default: return BlankLayout
  }
})
</script>

<template>
  <component :is="layout">
    <RouterView v-slot="{ Component }">
      <Transition name="fade" mode="out-in">
        <component :is="Component" />
      </Transition>
    </RouterView>
  </component>
</template>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 120ms ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
