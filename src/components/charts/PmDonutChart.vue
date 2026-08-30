<script setup lang="ts">
import { computed } from 'vue'
import { Doughnut } from 'vue-chartjs'

import type { CategorySlice } from '@/types/api'
import { ensureChartDefaults } from './chartDefaults'

const props = withDefaults(defineProps<{
  items: CategorySlice[]
  size?: number
  cutout?: string
}>(), { size: 132, cutout: '68%' })

ensureChartDefaults()

const chartData = computed(() => ({
  labels: props.items.map(i => i.label),
  datasets: [{
    data: props.items.map(i => i.count),
    backgroundColor: props.items.map(i => i.color),
    borderWidth: 0,
    // Expand on hover rather than adding a border: a border on a zero-count
    // slice draws a visible ring where there is no data.
    hoverOffset: 6,
  }],
}))

const options = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  cutout: props.cutout,
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (ctx: any) => {
          const item = props.items[ctx.dataIndex]
          return item ? ` ${item.label}: ${item.count} (${item.percentage.toFixed(0)}%)` : ''
        },
      },
    },
  },
}))

const isEmpty = computed(() => props.items.every(i => i.count === 0))
</script>

<template>
  <div class="relative shrink-0" :style="{ width: `${size}px`, height: `${size}px` }">
    <!-- An all-zero dataset renders nothing at all; draw an empty ring instead. -->
    <div
      v-if="isEmpty"
      class="absolute inset-0 rounded-full border-[10px] border-[var(--pm-surface-3)]"
    />
    <Doughnut v-else :data="chartData" :options="options as any" />

    <div class="pointer-events-none absolute inset-0 grid place-items-center">
      <div class="text-center">
        <slot />
      </div>
    </div>
  </div>
</template>
