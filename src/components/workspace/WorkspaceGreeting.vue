<script setup lang="ts">
import { computed } from 'vue'

import { useAuthStore } from '@/stores/auth'

defineProps<{ subtitle?: string }>()

const auth = useAuthStore()

/**
 * Time of day in the USER's timezone, not the browser's. A distributed team
 * should not be told "good evening" at 9am because the server is elsewhere.
 */
const greeting = computed(() => {
  const timeZone = auth.user?.timezone
    ?? Intl.DateTimeFormat().resolvedOptions().timeZone

  let hour: number
  try {
    hour = Number(new Intl.DateTimeFormat('en-GB', {
      hour: 'numeric', hour12: false, timeZone,
    }).format(new Date()))
  }
  catch {
    // An invalid stored timezone must not break the page.
    hour = new Date().getHours()
  }

  if (hour < 12)
    return 'Good morning'
  if (hour < 18)
    return 'Good afternoon'

  return 'Good evening'
})

const firstName = computed(() => auth.user?.name?.split(' ')[0] ?? '')
</script>

<template>
  <header>
    <h1 class="text-[26px] font-semibold leading-tight">
      {{ greeting }}, <span class="text-accent">{{ firstName }}</span>
    </h1>
    <p v-if="subtitle" class="mt-1 text-sm text-dim">{{ subtitle }}</p>
  </header>
</template>
