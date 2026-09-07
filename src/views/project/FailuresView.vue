<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useStorage } from '@vueuse/core'

import { useFailures } from '@/api/queries/failures'
import type { ApiError } from '@/api/client'
import { CATEGORY_META } from '@/composables/useCategoryMeta'
import type { FailureListItem } from '@/types/api'

const route = useRoute()
const slug = computed(() => String(route.params.slug))

// Seeded from the query string so the donut legend's "Database 33%" link lands
// on a list already scoped to that category.
const category = ref(String(route.query.category ?? ''))
const status = ref('')
const resolved = ref('')

// Persisted: grouping is a reading preference, and resetting it on every visit
// is a small, repeated annoyance.
const groupMode = useStorage('pm.failures.grouped', 'grouped')
const grouped = computed(() => groupMode.value === 'grouped')

const { data, isPending, isError, error, refetch } = useFailures(computed(() => ({
  project: slug.value,
  category: category.value || undefined,
  status: status.value || undefined,
  resolved: resolved.value === '' ? undefined : resolved.value === 'yes',
  per_page: 100,
})))

const failures = computed(() => data.value?.data ?? [])

interface Group {
  key: string
  category: string
  subcategory: string | null
  message: string | null
  items: FailureListItem[]
  latest: FailureListItem
  resolvedCount: number
}

/**
 * Group by (category, subcategory, error message).
 *
 * An ungrouped list after a bad week is forty rows of the same three problems.
 * Grouped, it is three rows with counts — which is the actual shape of the
 * information, and the view that makes recurring problems obvious.
 *
 * The real grouping key is the signature hash, but the list endpoint does not
 * expose it; this approximation collapses the same rows in practice.
 */
const groups = computed<Group[]>(() => {
  const map = new Map<string, Group>()

  for (const item of failures.value) {
    const key = `${item.category}|${item.subcategory ?? ''}|${item.error_message ?? ''}`
    const existing = map.get(key)

    if (existing) {
      existing.items.push(item)
      if (item.resolved_at)
        existing.resolvedCount++
    }
    else {
      map.set(key, {
        key,
        category: item.category,
        subcategory: item.subcategory,
        message: item.error_message,
        items: [item],
        latest: item,
        resolvedCount: item.resolved_at ? 1 : 0,
      })
    }
  }

  return [...map.values()].sort((a, b) => b.items.length - a.items.length)
})

const categoryOptions = [
  { key: '', label: 'All categories' },
  ...Object.entries(CATEGORY_META).map(([key, meta]) => ({ key, label: meta.label })),
]

const statusOptions = [
  { key: '', label: 'Any status' },
  { key: 'detected', label: 'Detected' },
  { key: 'analyzing', label: 'Analysing' },
  { key: 'analyzed', label: 'Analysed' },
  { key: 'analysis_failed', label: 'Analysis failed' },
  { key: 'resolved', label: 'Resolved' },
  { key: 'ignored', label: 'Ignored' },
]

const resolvedOptions = [
  { key: '', label: 'Resolved & open' },
  { key: 'no', label: 'Open only' },
  { key: 'yes', label: 'Resolved only' },
]
</script>

<template>
  <div class="mx-auto max-w-[1500px]">
    <div class="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 class="text-xl font-semibold">
          Failures
        </h1>
        <p class="mt-1 text-sm text-dim">
          {{ failures.length }} failure(s)
          <template v-if="grouped">· {{ groups.length }} distinct problem(s)</template>
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <PmSelect v-model="category" :options="categoryOptions" size="sm" />
        <PmSelect v-model="status" :options="statusOptions" size="sm" />
        <PmSelect v-model="resolved" :options="resolvedOptions" size="sm" />
        <PmSegmented
          v-model="groupMode"
          :options="[{ key: 'grouped', label: 'Grouped' }, { key: 'all', label: 'All' }]"
          size="sm"
        />
      </div>
    </div>

    <PmAsyncBoundary
      :loading="isPending"
      :error="isError ? (error as unknown as ApiError) : null"
      :empty="!failures.length"
      empty-title="No failures"
      empty-message="Nothing has failed in this range. That is the good outcome."
      @retry="refetch"
    >
      <div v-if="grouped" class="space-y-2">
        <FailureGroupRow v-for="group in groups" :key="group.key" :group="group" :slug="slug" />
      </div>

      <div v-else class="space-y-2">
        <FailureRow v-for="item in failures" :key="item.uuid" :failure="item" :slug="slug" />
      </div>
    </PmAsyncBoundary>
  </div>
</template>
