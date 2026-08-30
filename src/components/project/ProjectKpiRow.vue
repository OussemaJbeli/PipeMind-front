<script setup lang="ts">
import type { ProjectOverview } from '@/types/api'

defineProps<{ kpis: ProjectOverview['kpis'] | undefined, loading?: boolean }>()

/**
 * Sparkline type differs per metric, matching the mockup: counts read better as
 * bars, rates and durations as lines.
 */
const TILES = [
  { key: 'pipeline_health', label: 'Pipeline Health', icon: 'i-lucide-trending-up', color: 'var(--pm-accent)', spark: 'line' },
  { key: 'pipelines', label: 'Pipelines', icon: 'i-lucide-git-branch', color: 'var(--pm-accent)', spark: 'bar' },
  { key: 'failures', label: 'Failures', icon: 'i-lucide-circle-alert', color: 'var(--pm-danger)', spark: 'bar' },
  { key: 'avg_duration', label: 'Avg. Duration', icon: 'i-lucide-clock', color: 'var(--pm-running)', spark: 'line' },
  { key: 'mttr', label: 'MTTR', icon: 'i-lucide-timer', color: 'var(--pm-ai)', spark: 'line' },
] as const
</script>

<template>
  <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
    <KpiTile
      v-for="tile in TILES"
      :key="tile.key"
      compact
      :label="tile.label"
      :icon="tile.icon"
      :color="tile.color"
      :metric="kpis?.[tile.key]"
      :loading="loading"
      :spark="tile.spark"
    />
  </div>
</template>
