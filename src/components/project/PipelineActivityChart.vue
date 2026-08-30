<script setup lang="ts">
import type { ActivityChart } from '@/types/api'

defineProps<{ chart: ActivityChart }>()

const granularity = ref('daily')

const GRANULARITIES = [
  { key: 'hourly', label: 'Hourly' },
  { key: 'daily', label: 'Daily' },
  { key: 'weekly', label: 'Weekly' },
] as const

const chartRef = ref<{ hidden: Set<string>, toggle: (k: string) => void } | null>(null)
</script>

<template>
  <PmCard title="Pipeline Activity" :padded="false">
    <template #actions>
      <div class="flex items-center gap-4">
        <ChartLegend
          :series="chart.series"
          :hidden="chartRef?.hidden"
          @toggle="chartRef?.toggle($event)"
        />
        <PmSelect v-model="granularity" :options="GRANULARITIES" size="sm" class="w-[104px]" />
      </div>
    </template>

    <div class="px-5 pb-5">
      <PmLineChart
        ref="chartRef"
        :series="chart.series"
        fill-key="success"
        :step-size="25"
        :height="240"
      />
    </div>
  </PmCard>
</template>
