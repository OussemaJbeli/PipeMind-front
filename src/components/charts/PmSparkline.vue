<script setup lang="ts">
import { computed } from 'vue'
import { Bar, Line } from 'vue-chartjs'

import { ensureChartDefaults, resolveColor, withAlpha } from './chartDefaults'

const props = withDefaults(defineProps<{
  data: number[]
  color?: string
  type?: 'line' | 'bar'
  height?: number
  fill?: boolean
}>(), { color: 'var(--pm-accent)', type: 'line', height: 40, fill: true })

ensureChartDefaults()

const chartData = computed(() => ({
  labels: props.data.map((_, i) => String(i)),
  datasets: [{
    data: props.data,
    borderColor: resolveColor(props.color),
    borderWidth: 1.5,
    tension: 0.35,
    pointRadius: 0,
    fill: props.type === 'line' && props.fill,
    borderRadius: props.type === 'bar' ? 1 : undefined,
    barPercentage: 0.7,
    categoryPercentage: 0.9,
    backgroundColor: props.type === 'bar'
      ? resolveColor(props.color)
      : (ctx: any) => {
          const { chart } = ctx
          if (!chart.chartArea)
            return 'transparent'

          const g = chart.ctx.createLinearGradient(0, chart.chartArea.top, 0, chart.chartArea.bottom)
          g.addColorStop(0, withAlpha(props.color, 0.28))
          g.addColorStop(1, withAlpha(props.color, 0))
          return g
        },
  }],
}))

// A sparkline is a shape, not a readable chart. Strip every affordance.
const options = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false }, tooltip: { enabled: false } },
  scales: { x: { display: false }, y: { display: false, beginAtZero: true } },
  elements: { point: { radius: 0 } },
  animation: false as const,
}
</script>

<template>
  <div :style="{ height: `${height}px` }" aria-hidden="true">
    <Bar v-if="type === 'bar'" :data="chartData" :options="options" />
    <Line v-else :data="chartData" :options="options" />
  </div>
</template>
