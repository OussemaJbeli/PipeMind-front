<script setup lang="ts">
import { computed } from 'vue'

import { useAuthStore } from '@/stores/auth'

defineProps<{ projectName: string | undefined }>()

const auth = useAuthStore()

const greeting = computed(() => {
  const timeZone = auth.user?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone

  let hour: number
  try {
    hour = Number(new Intl.DateTimeFormat('en-GB', { hour: 'numeric', hour12: false, timeZone })
      .format(new Date()))
  }
  catch {
    hour = new Date().getHours()
  }

  return hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
})

const firstName = computed(() => auth.user?.name?.split(' ')[0] ?? '')
</script>

<template>
  <div>
    <h2 class="text-[22px] font-semibold leading-tight">
      {{ greeting }}, <span class="text-accent">{{ firstName }}</span>! 👋
    </h2>
    <p class="mt-1 text-sm text-dim">
      Here's what's happening with <span class="text-accent">{{ projectName }}</span>
    </p>
  </div>
</template>
