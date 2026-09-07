<script setup lang="ts">
import type { ApiError } from '@/api/client'
import { useActivityFeed } from '@/api/queries/workspaceAdmin'
import { useWorkspaceProjects } from '@/api/queries/workspace'
import type { ActivityItem } from '@/types/api'

const { data: projects } = useWorkspaceProjects()

const filters = reactive({ project: '', level: '', action: '' })
const cursor = ref<string | null>(null)
const accumulated = ref<ActivityItem[]>([])

const { data, isPending, isError, error, refetch } = useActivityFeed(filters, cursor)

/**
 * Pages accumulate rather than replace.
 *
 * Cursor pagination, not offset: the feed grows while it is being read, and an
 * offset would show the same row twice or skip one as new entries push the
 * window down.
 */
watch(data, (page) => {
  if (!page)
    return

  accumulated.value = cursor.value ? [...accumulated.value, ...page.data] : page.data
})

// Any filter change restarts the list — appending across different filters
// would interleave rows from two different questions.
watch(filters, () => {
  cursor.value = null
  accumulated.value = []
})

function loadMore() {
  cursor.value = data.value?.meta.next_cursor ?? null
}

const projectOptions = computed(() => [
  { key: '', label: 'All projects' },
  ...(projects.value ?? []).map(p => ({ key: p.slug, label: p.name })),
])

const actionOptions = computed(() => [
  { key: '', label: 'All activity' },
  ...(data.value?.filters.actions ?? []).map(a => ({ key: a, label: a })),
])

const LEVELS = [
  { key: '', label: 'Any level' },
  { key: 'error', label: 'Errors' },
  { key: 'warning', label: 'Warnings' },
  { key: 'success', label: 'Success' },
  { key: 'info', label: 'Info' },
]
</script>

<template>
  <div class="mx-auto max-w-[1000px]">
    <div class="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 class="text-xl font-semibold">Activity</h1>
        <p class="mt-1 text-sm text-dim">
          Everything that happened across this workspace.
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <PmSelect v-model="filters.project" :options="projectOptions" size="sm" />
        <PmSelect v-model="filters.action" :options="actionOptions" size="sm" />
        <PmSelect v-model="filters.level" :options="LEVELS" size="sm" />
      </div>
    </div>

    <PmAsyncBoundary
      :loading="isPending && !accumulated.length"
      :error="isError ? (error as unknown as ApiError) : null"
      :empty="!isPending && !accumulated.length"
      empty-title="Nothing here yet"
      empty-message="Activity appears as pipelines run and failures are analysed."
      @retry="refetch"
    >
      <PmCard :padded="false">
        <ul class="divide-y">
          <li v-for="item in accumulated" :key="item.uuid" class="px-4 py-1">
            <ActivityItem :item="item" />
          </li>
        </ul>
      </PmCard>

      <div v-if="data?.meta.has_more" class="mt-4 text-center">
        <PmButton variant="secondary" size="sm" :loading="isPending" @click="loadMore">
          Load more
        </PmButton>
      </div>
    </PmAsyncBoundary>
  </div>
</template>
