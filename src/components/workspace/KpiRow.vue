<script setup lang="ts">
import type { ApiError } from '@/api/client'
import type { WorkspaceSummary } from '@/types/api'

defineProps<{
  summary: WorkspaceSummary | undefined
  loading?: boolean
  error?: ApiError | null
}>()

/**
 * Icon tiles stay accent-coloured across all four, matching the mockup — they
 * read as a set. Meaning lives in the delta, which is where the server told us
 * which direction is good.
 */
const TILES = [
  { key: 'projects', label: 'Projects', icon: 'i-lucide-box' },
  { key: 'pipelines_today', label: 'Pipelines today', icon: 'i-lucide-git-branch' },
  { key: 'failures_today', label: 'Failures today', icon: 'i-lucide-circle-alert' },
  { key: 'success_rate', label: 'Avg. success rate', icon: 'i-lucide-trending-up' },
] as const
</script>

<template>
  <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
    <KpiTile
      v-for="tile in TILES"
      :key="tile.key"
      :label="tile.label"
      :icon="tile.icon"
      :metric="summary?.[tile.key]"
      :loading="loading"
    />
  </div>
</template>
