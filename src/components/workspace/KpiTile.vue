<script setup lang="ts">
import type { Metric } from '@/types/api'

withDefaults(defineProps<{
  label: string
  icon: string
  color?: string
  metric: Metric | undefined
  loading?: boolean
  /** Project board tiles carry a sparkline; workspace tiles do not. */
  spark?: 'line' | 'bar' | null
  compact?: boolean
}>(), { color: 'var(--pm-accent)', spark: null })
</script>

<template>
  <PmCard hoverable>
    <div v-if="loading" class="flex items-start gap-4">
      <PmSkeleton class="size-11 shrink-0" rounded="var(--pm-radius)" />
      <div class="flex-1 space-y-2">
        <PmSkeleton class="h-3 w-24" />
        <PmSkeleton class="h-7 w-16" />
        <PmSkeleton class="h-3 w-20" />
      </div>
    </div>

    <template v-else>
      <div class="flex items-start gap-3.5">
        <PmIconTile :icon="icon" :color="color" :size="compact ? 'sm' : 'md'" />

        <div class="min-w-0 flex-1">
          <p
            class="font-medium text-dim"
            :class="compact
              ? 'text-[13px]'
              : 'text-[11px] uppercase tracking-wider'"
          >
            {{ label }}
          </p>

          <p
            class="mt-1 font-semibold leading-none tnum"
            :class="compact ? 'text-[26px]' : 'text-[30px]'"
          >
            {{ metric?.display ?? metric?.value ?? '—' }}<span
              v-if="metric?.unit && !metric?.display"
              class="text-xl"
            >{{ metric.unit }}</span>
          </p>

          <DeltaLabel :metric="metric" :show-arrow="compact" class="mt-1.5" :size="compact ? 'xs' : 'sm'" />
        </div>
      </div>

      <PmSparkline
        v-if="spark && metric?.spark?.length"
        class="mt-3"
        :data="metric.spark"
        :type="spark"
        :color="color"
        :height="38"
      />
    </template>
  </PmCard>
</template>
