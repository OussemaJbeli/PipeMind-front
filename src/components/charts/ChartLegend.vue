<script setup lang="ts">
import type { ChartSeries } from '@/types/api'

defineProps<{ series: ChartSeries[], hidden?: Set<string> }>()
defineEmits<{ toggle: [key: string] }>()
</script>

<template>
  <ul class="flex items-center gap-3">
    <li v-for="s in series" :key="s.key">
      <button
        class="flex items-center gap-1.5 text-[11px] transition-opacity"
        :class="hidden?.has(s.key) ? 'text-mute opacity-50' : 'text-dim hover:text-fg'"
        @click="$emit('toggle', s.key)"
      >
        <span class="size-2 shrink-0 rounded-full" :style="{ background: s.color }" />
        {{ s.label }}
      </button>
    </li>
  </ul>
</template>
