<script setup lang="ts">
import { ref } from 'vue'

import type { CategorySlice, ChartSeries } from '@/types/api'
import { CATEGORY_META } from '@/composables/useCategoryMeta'
import { PIPELINE_STATUS_META, SEVERITY_META } from '@/composables/useStatusMeta'
import { bytes, cost, duration, percent } from '@/utils/format'
import type { PipelineStatus, Severity } from '@/types/domain'

const statuses = Object.keys(PIPELINE_STATUS_META) as PipelineStatus[]
const severities = Object.keys(SEVERITY_META) as Severity[]

const toggle = ref(true)
const segment = ref('grid')
const select = ref('7d')
const text = ref('')

const spark = [96.1, 97, 96.4, 98.2, 97.8, 98.9, 98.2]
const sparkBars = [14, 19, 17, 22, 18, 20, 17]

const series: ChartSeries[] = [
  {
    key: 'success',
    label: 'Success',
    color: '#A9E831',
    points: Array.from({ length: 7 }, (_, i) => ({
      x: new Date(Date.now() - (6 - i) * 864e5).toISOString(),
      y: 60 + Math.round(Math.sin(i) * 12) + 10,
    })),
  },
  {
    key: 'failed',
    label: 'Failed',
    color: '#F04438',
    points: Array.from({ length: 7 }, (_, i) => ({
      x: new Date(Date.now() - (6 - i) * 864e5).toISOString(),
      y: Math.max(0, 6 - i),
    })),
  },
  {
    key: 'running',
    label: 'Running',
    color: '#6366F1',
    points: Array.from({ length: 7 }, (_, i) => ({
      x: new Date(Date.now() - (6 - i) * 864e5).toISOString(),
      y: (i % 3) + 1,
    })),
  },
]

const slices: CategorySlice[] = [
  { category: 'DATABASE', label: 'Database', count: 1, percentage: 33.3, color: '#A9E831' },
  { category: 'TEST', label: 'Tests', count: 1, percentage: 33.3, color: '#F04438' },
  { category: 'DEPENDENCY', label: 'Dependencies', count: 1, percentage: 33.3, color: '#F5A524' },
  { category: 'OTHER', label: 'Others', count: 0, percentage: 0, color: '#5C6472' },
]

const bars = Array.from({ length: 30 }, (_, i) => ({
  date: new Date(Date.now() - (29 - i) * 864e5).toISOString(),
  value: i === 12 || i === 21 ? 62 : 92 + (i % 8),
}))
</script>

<template>
  <div class="mx-auto max-w-[1400px] space-y-8">
    <header>
      <h1 class="text-2xl font-semibold">Kitchen sink</h1>
      <p class="mt-1 text-sm text-dim">
        Every base component and chart. Toggle the theme in the top bar — nothing here
        may hardcode a colour.
      </p>
    </header>

    <PmCard title="Buttons">
      <div class="flex flex-wrap items-center gap-3">
        <PmButton variant="primary">Primary</PmButton>
        <PmButton variant="secondary">Secondary</PmButton>
        <PmButton variant="outline">Outline</PmButton>
        <PmButton variant="ghost">Ghost</PmButton>
        <PmButton variant="danger">Danger</PmButton>
        <PmButton variant="primary" loading>Loading</PmButton>
        <PmButton variant="primary" disabled>Disabled</PmButton>
        <PmButton variant="primary" size="sm">Small</PmButton>
        <PmButton variant="primary" size="lg">Large</PmButton>
      </div>
    </PmCard>

    <PmCard title="Status pills & severity">
      <div class="flex flex-wrap gap-2">
        <PmStatusPill v-for="s in statuses" :key="s" :status="s" />
      </div>
      <div class="mt-4 flex flex-wrap gap-2">
        <PmBadge v-for="s in severities" :key="s" :tone="s === 'low' ? 'dim' : s === 'medium' ? 'warning' : 'danger'">
          {{ SEVERITY_META[s].label }}
        </PmBadge>
      </div>
    </PmCard>

    <PmCard title="Category metadata — must match the backend enum">
      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div v-for="(meta, key) in CATEGORY_META" :key="key" class="flex items-center gap-3">
          <PmIconTile :icon="meta.icon" :color="meta.color" size="sm" />
          <div class="min-w-0">
            <p class="truncate text-[13px] font-medium">{{ meta.label }}</p>
            <p class="font-mono text-[11px] text-mute">{{ meta.color }}</p>
          </div>
        </div>
      </div>
    </PmCard>

    <div class="grid gap-6 lg:grid-cols-2">
      <PmCard title="Form controls">
        <div class="space-y-4">
          <PmInput v-model="text" label="Search" icon="i-lucide-search" placeholder="Search projects…" />
          <PmInput v-model="text" label="With error" error="This field is required." />
          <PmSelect
            v-model="select"
            label="Range"
            icon="i-lucide-calendar"
            :options="[
              { key: '24h', label: 'Last 24 hours' },
              { key: '7d', label: 'Last 7 days' },
              { key: '30d', label: 'Last 30 days' },
            ]"
          />
          <PmSegmented
            v-model="segment"
            aria-label="View mode"
            :options="[
              { key: 'grid', icon: 'i-lucide-layout-grid' },
              { key: 'list', icon: 'i-lucide-list' },
            ]"
          />
          <PmToggle v-model="toggle" label="Auto-analyse failures" description="Runs an AI analysis when a pipeline fails." />
        </div>
      </PmCard>

      <PmCard title="Feedback">
        <div class="space-y-3">
          <PmAlert tone="info">A neutral, informational message.</PmAlert>
          <PmAlert tone="success">The pipeline completed successfully.</PmAlert>
          <PmAlert tone="warning">Build duration is 4.1× your project average.</PmAlert>
          <PmAlert tone="danger">The analysis service is unreachable.</PmAlert>
          <PmAlert tone="accent">This looks transient — a retry may succeed.</PmAlert>
          <PmProgressBar :value="19" threshold class="mt-4" />
          <PmProgressBar :value="78" threshold />
          <PmProgressBar :value="94" threshold />
        </div>
      </PmCard>
    </div>

    <div class="grid gap-6 lg:grid-cols-3">
      <PmCard title="Sparklines">
        <p class="mb-1 text-[11px] uppercase tracking-wider text-dim">Line</p>
        <PmSparkline :data="spark" color="var(--pm-accent)" />
        <p class="mb-1 mt-4 text-[11px] uppercase tracking-wider text-dim">Bar</p>
        <PmSparkline :data="sparkBars" type="bar" color="var(--pm-running)" />
      </PmCard>

      <PmCard title="Radial gauges">
        <div class="flex items-center justify-around">
          <PmRadialGauge :value="98" />
          <PmRadialGauge :value="88" />
          <PmRadialGauge :value="62" />
        </div>
      </PmCard>

      <PmCard title="Donut">
        <div class="flex items-center gap-4">
          <PmDonutChart :items="slices">
            <p class="text-[26px] font-semibold leading-none tnum">3</p>
            <p class="text-[11px] text-dim">Total</p>
          </PmDonutChart>
          <ul class="min-w-0 flex-1 space-y-2 text-[13px]">
            <li v-for="i in slices" :key="i.category" class="flex items-center gap-2 text-dim">
              <span class="size-2 rounded-full" :style="{ background: i.color }" />
              <span class="min-w-0 flex-1 truncate">{{ i.label }}</span>
              <span class="tnum">{{ i.percentage.toFixed(0) }}%</span>
            </li>
          </ul>
        </div>
      </PmCard>
    </div>

    <PmCard title="Pipeline activity" :padded="false">
      <template #actions>
        <ChartLegend :series="series" />
      </template>
      <div class="px-5 pb-5">
        <PmLineChart :series="series" fill-key="success" :step-size="25" />
      </div>
    </PmCard>

    <PmCard title="Success rate">
      <PmBarChart :data="bars" :thresholds="{ good: 95, warn: 80 }" />
    </PmCard>

    <PmCard title="Category bars">
      <PmCategoryBars :items="slices" />
    </PmCard>

    <div class="grid gap-6 lg:grid-cols-3">
      <PmCard title="Empty"><PmEmptyState compact title="No projects yet" message="Connect a CI/CD platform to start monitoring." /></PmCard>
      <PmCard title="Error"><PmErrorState compact title="Analysis service unavailable" message="The pipeline failure is real — only the analysis failed." /></PmCard>
      <PmCard title="Loading"><PmSkeleton class="h-4 w-3/4" /><PmSkeleton class="mt-2 h-4 w-1/2" /><PmSkeleton class="mt-2 h-20 w-full" /></PmCard>
    </div>

    <PmCard title="Formatters">
      <dl class="grid gap-2 font-mono text-[13px] sm:grid-cols-2">
        <div class="flex justify-between"><dt class="text-dim">duration(134)</dt><dd>{{ duration(134) }}</dd></div>
        <div class="flex justify-between"><dt class="text-dim">duration(222)</dt><dd>{{ duration(222) }}</dd></div>
        <div class="flex justify-between"><dt class="text-dim">duration(1080)</dt><dd>{{ duration(1080) }}</dd></div>
        <div class="flex justify-between"><dt class="text-dim">duration(null)</dt><dd>{{ duration(null) }}</dd></div>
        <div class="flex justify-between"><dt class="text-dim">percent(98.2)</dt><dd>{{ percent(98.2) }}</dd></div>
        <div class="flex justify-between"><dt class="text-dim">bytes(2481920)</dt><dd>{{ bytes(2481920) }}</dd></div>
        <div class="flex justify-between"><dt class="text-dim">cost(0.000412)</dt><dd>{{ cost(0.000412) }}</dd></div>
        <div class="flex justify-between"><dt class="text-dim">cost(4.82)</dt><dd>{{ cost(4.82) }}</dd></div>
      </dl>
    </PmCard>
  </div>
</template>
