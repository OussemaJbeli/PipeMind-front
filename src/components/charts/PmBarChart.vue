<script setup lang="ts">
import { format } from 'date-fns'
import { computed } from 'vue'
import { Bar } from 'vue-chartjs'

import { AXIS, ensureChartDefaults } from './chartDefaults'

export interface BarDatum {
  date: string
  value: number
  meta?: Record<string, number | string>
}

const props = withDefaults(defineProps<{
  data: BarDatum[]
  height?: number
  max?: number
  suffix?: string
  /** Colour each bar by threshold so a bad day is visible without reading the axis. */
  thresholds?: { good: number, warn: number }
  tooltipLines?: (datum: BarDatum) => string[]
}>(), { height: 150, max: 100, suffix: '%' })

ensureChartDefaults()

const chartData = computed(() => ({
  labels: props.data.map(d => format(new Date(d.date), 'MMM dd')),
  datasets: [{
    data: props.data.map(d => d.value),
    backgroundColor: props.data.map((d) => {
      if (!props.thresholds)
        return 'var(--pm-accent)'

      return d.value >= props.thresholds.good
        ? 'var(--pm-accent)'
        : d.value >= props.thresholds.warn ? 'var(--pm-warning)' : 'var(--pm-danger)'
    }),
    borderRadius: 2,
    barPercentage: 0.72,
    categoryPercentage: 0.85,
  }],
}))

const options = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (ctx: any) => {
          const datum = props.data[ctx.dataIndex]
          if (!datum)
            return ''

          return props.tooltipLines?.(datum) ?? [` ${datum.value}${props.suffix}`]
        },
      },
    },
  },
  scales: {
    x: { ...AXIS, grid: { display: false }, ticks: { ...AXIS.ticks, maxTicksLimit: 6 } },
    y: {
      ...AXIS,
      min: 0,
      max: props.max,
      ticks: {
        ...AXIS.ticks,
        stepSize: props.max / 2,
        callback: (v: number | string) => `${v}${props.suffix}`,
      },
    },
  },
}))
</script>

<template>
  <div :style="{ height: `${height}px` }">
    <Bar :data="chartData" :options="options as any" />
  </div>
</template>
