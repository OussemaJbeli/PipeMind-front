<script setup lang="ts">
import { ref } from 'vue'

import { useProjectOverview } from '@/api/queries/project'
import type { RangeKey } from '@/types/domain'

const props = defineProps<{ slug: string }>()

const range = ref<RangeKey>('7d')
const { data, isLoading, error } = useProjectOverview(() => props.slug, range)
</script>

<template>
  <div class="mx-auto max-w-[1700px]">
    <h1 class="text-2xl font-semibold">Overview</h1>

    <p v-if="isLoading" class="mt-6 text-sm text-dim">Loading…</p>
    <p v-else-if="error" class="mt-6 text-sm text-[var(--pm-danger)]">{{ (error as any).message }}</p>

    <template v-else-if="data">
      <p class="mt-1 text-sm text-dim">
        Here's what's happening with <span class="text-accent">{{ data.project.name }}</span>
      </p>

      <!-- Scaffolding only — file 15 replaces this with the real board. -->
      <div class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
        <div
          v-for="(metric, key) in data.kpis"
          :key="key"
          class="rounded-[var(--pm-radius-lg)] border bg-surface p-5"
        >
          <p class="text-[13px] font-medium text-dim">{{ String(key).replace(/_/g, ' ') }}</p>
          <p class="mt-1 text-[26px] font-semibold leading-none tnum">
            {{ metric.display ?? `${metric.value}${metric.unit ?? ''}` }}
          </p>
          <p v-if="metric.delta_label" class="mt-1.5 text-[11px] text-dim">{{ metric.delta_label }}</p>
        </div>
      </div>

      <div
        v-if="data.insight"
        class="mt-5 rounded-[var(--pm-radius-lg)] border border-[color:var(--pm-accent)]/35 bg-surface p-5 shadow-[0_0_28px_var(--pm-accent-glow)]"
      >
        <p class="flex items-center gap-2 text-[15px] font-semibold">
          <i-lucide-sparkles class="size-4 text-accent" /> AI Insight
        </p>
        <p class="mt-3 text-[13px] leading-relaxed text-dim">{{ data.insight.headline }}</p>
        <p v-if="data.insight.detail" class="mt-1.5 text-[13px] leading-relaxed text-dim">
          {{ data.insight.detail }}
        </p>
      </div>
    </template>
  </div>
</template>
