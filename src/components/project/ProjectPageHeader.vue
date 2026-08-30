<script setup lang="ts">
import type { RangeKey } from '@/types/domain'

defineProps<{ title: string, refreshing?: boolean }>()
defineEmits<{ refresh: [] }>()

const range = defineModel<RangeKey>('range', { required: true })

const RANGES = [
  { key: '24h', label: 'Last 24 hours' },
  { key: '7d', label: 'Last 7 days' },
  { key: '30d', label: 'Last 30 days' },
  { key: '90d', label: 'Last 90 days' },
] as const
</script>

<template>
  <div class="flex flex-wrap items-center justify-between gap-3">
    <h1 class="text-2xl font-semibold">{{ title }}</h1>

    <div class="flex items-center gap-2">
      <PmSelect
        v-model="range"
        :options="RANGES"
        icon="i-lucide-calendar"
        class="w-[168px]"
      />

      <PmButton variant="secondary">
        <i-lucide-sliders-horizontal class="size-4" /> Filters
      </PmButton>

      <PmButton variant="secondary" aria-label="Refresh" @click="$emit('refresh')">
        <i-lucide-refresh-cw class="size-4" :class="refreshing && 'animate-spin'" />
      </PmButton>
    </div>
  </div>
</template>
