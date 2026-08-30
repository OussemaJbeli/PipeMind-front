<script setup lang="ts">
import { format } from 'date-fns'
import { computed, ref } from 'vue'
import { Line } from 'vue-chartjs'

import type { ChartSeries } from '@/types/api'
import { AXIS, ensureChartDefaults } from './chartDefaults'

const props = withDefaults(defineProps<{
  series: ChartSeries[]
  height?: number
  /** Only this series gets a gradient fill — matching the mockup. */
  fillKey?: string
  stepSize?: number
}>(), { height: 240 })

ensureChartDefaults()

const hidden = ref(new Set<string>())

function toggle(key: string) {
  const next = new Set(hidden.value)
  next.has(key) ? next.delete(key) : next.add(key)
  hidden.value = next
}

const visible = computed(() => props.series.filter(s => !hidden.value.has(s.key)))

const chartData = computed(() => ({
  labels: (props.series[0]?.points ?? []).map(p => format(new Date(p.x), 'MMM d')),
  datasets: visible.value.map(s => ({
    label: s.label,
    data: s.points.map(p => p.y),
    borderColor: s.color,
    borderWidth: 2,
    tension: 0.35,
    pointRadius: 2.5,
    pointHoverRadius: 5,
    pointBackgroundColor: s.color,
    pointBorderColor: 'var(--pm-bg)',
    pointBorderWidth: 2,
    fill: s.key === props.fillKey,
    backgroundColor: `color-mix(in srgb, ${s.color} 14%, transparent)`,
  })),
}))

const options = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  // One tooltip listing every series at the hovered x — comparing across
  // separate tooltips is exactly the work the chart should be doing for you.
  interaction: { mode: 'index' as const, intersect: false },
  plugins: {
    legend: { display: false },
    tooltip: { callbacks: { title: (items: any[]) => items[0]?.label ?? '' } },
  },
  scales: {
    x: { ...AXIS, grid: { display: false } },
    y: {
      ...AXIS,
      beginAtZero: true,
      ticks: { ...AXIS.ticks, ...(props.stepSize ? { stepSize: props.stepSize } : {}) },
    },
  },
}))

defineExpose({ hidden, toggle })
</script>

<template>
  <div :style="{ height: `${height}px` }">
    <Line :data="chartData" :options="options as any" />
  </div>
</template>
