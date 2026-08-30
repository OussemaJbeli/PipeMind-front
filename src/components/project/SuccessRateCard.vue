<script setup lang="ts">
import { computed, ref } from 'vue'

import type { ProjectOverview } from '@/types/api'

const props = defineProps<{ chart: ProjectOverview['success_rate_chart'] }>()

const range = ref('30d')

const RANGES = [
  { key: '30d', label: 'Last 30 days' },
  { key: '90d', label: 'Last 90 days' },
] as const

const bars = computed(() => props.chart.bars.map(bar => ({
  date: bar.date,
  value: bar.success_rate,
  meta: { total: bar.total, failed: bar.failed },
})))

function tooltipLines(datum: { value: number, meta?: Record<string, number | string> }) {
  return [
    ` ${datum.value.toFixed(1)}% success`,
    ` ${datum.meta?.total ?? 0} pipelines, ${datum.meta?.failed ?? 0} failed`,
  ]
}
</script>

<template>
  <PmCard :padded="false">
    <template #header>
      <div class="flex w-full items-center justify-between px-5 pb-3 pt-4">
        <h3 class="flex items-center gap-1.5 text-[15px] font-semibold">
          Pipeline Success Rate
          <PmTooltip content="Percentage of pipelines that completed successfully each day.">
            <i-lucide-info class="size-3.5 text-mute" />
          </PmTooltip>
        </h3>
        <PmSelect v-model="range" :options="RANGES" size="sm" class="w-[150px]" />
      </div>
    </template>

    <div class="grid gap-6 px-5 pb-5 lg:grid-cols-[168px_minmax(0,1fr)]">
      <div class="self-center">
        <p class="text-[34px] font-semibold leading-none tnum">
          {{ chart.value.toFixed(1) }}%
        </p>
        <p
          class="mt-2 text-xs font-medium"
          :class="chart.delta >= 0 ? 'text-accent' : 'text-[var(--pm-danger)]'"
        >
          {{ chart.delta >= 0 ? '+' : '' }}{{ chart.delta.toFixed(1) }}% vs last 7 days
        </p>
      </div>

      <PmBarChart
        :data="bars"
        :thresholds="{ good: 95, warn: 80 }"
        :tooltip-lines="tooltipLines"
        :height="150"
      />
    </div>
  </PmCard>
</template>
