<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'

import type { ApiError } from '@/api/client'
import { useAnalyses } from '@/api/queries/pipelines'
import { categoryMeta } from '@/composables/useCategoryMeta'

const props = defineProps<{ slug: string }>()

const route = useRoute()
const router = useRouter()
const page = computed(() => Number(route.query.page ?? 1))

const { data, isPending, isError, error, refetch } = useAnalyses(() => props.slug, page)

const rows = computed(() => data.value?.data ?? [])
const totals = computed(() => data.value?.totals)
const meta = computed(() => data.value?.meta)

function money(usd: number) {
  return usd < 0.01 && usd > 0 ? `$${usd.toFixed(4)}` : `$${usd.toFixed(2)}`
}

function goToPage(next: number) {
  router.replace({ query: { ...route.query, page: next > 1 ? next : undefined } })
}
</script>

<template>
  <div class="mx-auto max-w-[1500px]">
    <h1 class="text-xl font-semibold">
      AI analyses
    </h1>
    <p class="mt-1 text-sm text-dim">
      What PipeMind concluded, what it cost, and whether anyone agreed.
    </p>

    <!--
      The numbers sit at the top because they are the two questions a reviewer
      asks first: what is this costing, and is it any good. Burying them under a
      table would answer neither.
    -->
    <div v-if="totals" class="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      <PmCard>
        <p class="text-[11px] uppercase tracking-wider text-mute">Analyses</p>
        <p class="mt-1 text-xl font-semibold tnum">{{ totals.analyses }}</p>
      </PmCard>
      <PmCard>
        <p class="text-[11px] uppercase tracking-wider text-mute">Total cost</p>
        <p class="mt-1 text-xl font-semibold tnum">{{ money(totals.cost_usd) }}</p>
      </PmCard>
      <PmCard>
        <p class="text-[11px] uppercase tracking-wider text-mute">Avg latency</p>
        <p class="mt-1 text-xl font-semibold tnum">{{ (totals.avg_latency_ms / 1000).toFixed(1) }}s</p>
      </PmCard>
      <PmCard>
        <p class="text-[11px] uppercase tracking-wider text-mute">Avg confidence</p>
        <p class="mt-1 text-xl font-semibold tnum">{{ Math.round(totals.avg_confidence * 100) }}%</p>
      </PmCard>
      <PmCard>
        <PmTooltip content="Reused analyses cost nothing and call no model. This is the number that shows whether caching earns its complexity.">
          <p class="text-[11px] uppercase tracking-wider text-mute">Cache hits</p>
        </PmTooltip>
        <p class="mt-1 text-xl font-semibold tnum">{{ Math.round(totals.cache_hit_rate * 100) }}%</p>
      </PmCard>
    </div>

    <PmAsyncBoundary
      class="mt-5"
      :loading="isPending"
      :error="isError ? (error as unknown as ApiError) : null"
      :empty="!rows.length"
      empty-title="No analyses yet"
      empty-message="Analyses appear here once PipeMind has examined a failure."
      @retry="refetch"
    >
      <div class="space-y-1.5">
        <RouterLink
          v-for="row in rows"
          :key="row.uuid"
          :to="{ name: 'project.failure', params: { slug, uuid: row.failure_uuid } }"
          class="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-[var(--pm-radius)] border bg-surface px-4 py-3 transition-colors hover:bg-surface-2"
        >
          <i
            v-if="row.category"
            :class="categoryMeta(row.category).icon"
            class="size-4 shrink-0"
            :style="{ color: categoryMeta(row.category).color }"
          />

          <span class="min-w-0 flex-1 truncate text-[13px]">
            {{ row.summary ?? 'No summary' }}
          </span>

          <span v-if="row.confidence !== null" class="w-[46px] shrink-0 text-right text-[12px] tnum text-dim">
            {{ Math.round(row.confidence * 100) }}%
          </span>

          <span class="w-[92px] shrink-0 truncate text-right text-[11px] text-mute">
            {{ row.model_name ?? row.model_provider ?? '—' }}
          </span>

          <span class="w-[62px] shrink-0 text-right text-[11px] tnum text-mute">
            {{ money(row.cost_usd) }}
          </span>

          <span class="w-[48px] shrink-0 text-right text-[11px] tnum text-mute">
            {{ row.latency_ms !== null ? `${(row.latency_ms / 1000).toFixed(1)}s` : '—' }}
          </span>

          <span class="w-[62px] shrink-0 text-right">
            <PmBadge v-if="row.cache_hit" tone="dim" size="sm">cached</PmBadge>
          </span>

          <!-- Three states, not two: nobody has judged this yet is different
               from somebody judged it wrong, and the training set depends on
               telling them apart. -->
          <span class="w-[24px] shrink-0 text-right">
            <i
              v-if="row.was_helpful === true"
              class="i-lucide-thumbs-up size-3.5 text-accent"
            />
            <i
              v-else-if="row.was_helpful === false"
              class="i-lucide-thumbs-down size-3.5 text-[var(--pm-warning)]"
            />
            <span v-else class="text-[11px] text-mute">—</span>
          </span>
        </RouterLink>
      </div>

      <div v-if="meta && meta.last_page > 1" class="mt-5 flex items-center justify-center gap-2">
        <PmButton size="sm" variant="ghost" :disabled="page <= 1" @click="goToPage(page - 1)">
          Previous
        </PmButton>
        <span class="text-xs text-mute">Page {{ meta.current_page }} of {{ meta.last_page }}</span>
        <PmButton size="sm" variant="ghost" :disabled="page >= meta.last_page" @click="goToPage(page + 1)">
          Next
        </PmButton>
      </div>
    </PmAsyncBoundary>
  </div>
</template>
