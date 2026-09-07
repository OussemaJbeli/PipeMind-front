<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'

import type { ApiError } from '@/api/client'
import { usePipelines } from '@/api/queries/pipelines'

const props = defineProps<{ slug: string }>()

const route = useRoute()
const router = useRouter()

/**
 * Filters live in the URL.
 *
 * A filtered view has to survive a reload and be pasteable into a chat message —
 * "look at the failed runs on main" is a link, not a set of clicks to reproduce.
 */
function queryRef(key: string, fallback = '') {
  return computed({
    get: () => String(route.query[key] ?? fallback),
    set: (value: string) => {
      router.replace({
        query: { ...route.query, [key]: value || undefined, page: undefined },
      })
    },
  })
}

const status = queryRef('status')
const branch = queryRef('ref')
const source = queryRef('source')
const range = queryRef('range', '7d')
const page = computed(() => Number(route.query.page ?? 1))

const { data, isPending, isError, error, refetch, anyRunning } = usePipelines(
  () => props.slug,
  computed(() => ({
    status: status.value,
    ref: branch.value,
    source: source.value,
    range: range.value,
    page: page.value,
  })),
)

const pipelines = computed(() => data.value?.data ?? [])
const meta = computed(() => data.value?.meta)

const branchOptions = computed(() => [
  { key: '', label: 'All branches' },
  ...(data.value?.filters?.refs ?? []).map(ref => ({ key: ref, label: ref })),
])

const statusOptions = [
  { key: '', label: 'Any status' },
  { key: 'success', label: 'Success' },
  { key: 'failed', label: 'Failed' },
  { key: 'running', label: 'Running' },
  { key: 'canceled', label: 'Canceled' },
]

const sourceOptions = [
  { key: '', label: 'Any trigger' },
  { key: 'push', label: 'Push' },
  { key: 'merge_request', label: 'Merge request' },
  { key: 'schedule', label: 'Schedule' },
  { key: 'manual', label: 'Manual' },
]

const rangeOptions = [
  { key: '24h', label: 'Last 24h' },
  { key: '7d', label: 'Last 7 days' },
  { key: '30d', label: 'Last 30 days' },
  { key: '90d', label: 'Last 90 days' },
]

function goToPage(next: number) {
  router.replace({ query: { ...route.query, page: next > 1 ? next : undefined } })
}
</script>

<template>
  <div class="mx-auto max-w-[1500px]">
    <div class="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 class="text-xl font-semibold">
          Pipelines
        </h1>
        <p class="mt-1 flex items-center gap-2 text-sm text-dim">
          {{ meta?.total ?? 0 }} run(s)
          <span v-if="anyRunning" class="flex items-center gap-1 text-accent">
            <i-lucide-loader-circle class="size-3 animate-spin" />live
          </span>
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <PmSelect v-model="status" :options="statusOptions" size="sm" />
        <PmSelect v-model="branch" :options="branchOptions" size="sm" />
        <PmSelect v-model="source" :options="sourceOptions" size="sm" />
        <PmSelect v-model="range" :options="rangeOptions" size="sm" />
      </div>
    </div>

    <PmAsyncBoundary
      :loading="isPending"
      :error="isError ? (error as unknown as ApiError) : null"
      :empty="!pipelines.length"
      empty-title="No pipelines"
      empty-message="Nothing has run in this range."
      @retry="refetch"
    >
      <div class="space-y-1.5">
        <PipelineRow
          v-for="pipeline in pipelines"
          :key="pipeline.uuid"
          :pipeline="pipeline"
          :slug="slug"
        />
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
