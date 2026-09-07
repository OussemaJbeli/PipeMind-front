<script setup lang="ts">
import { categoryMeta } from '@/composables/useCategoryMeta'
import { useRelativeTime } from '@/composables/useRelativeTime'
import type { FailureListItem } from '@/types/api'

const props = defineProps<{ failure: FailureListItem, slug: string, compact?: boolean }>()

const meta = computed(() => categoryMeta(props.failure.category))
const when = useRelativeTime(() => props.failure.failed_at)

const STATUS_TONE: Record<string, 'accent' | 'warning' | 'danger' | 'dim'> = {
  analyzed: 'accent',
  resolved: 'accent',
  analyzing: 'dim',
  queued: 'dim',
  analysis_failed: 'warning',
  ignored: 'dim',
  detected: 'dim',
}
</script>

<template>
  <RouterLink
    :to="{ name: 'project.failure', params: { slug, uuid: failure.uuid } }"
    class="flex items-center gap-3 rounded-[var(--pm-radius)] border bg-surface px-4 py-3 transition-colors hover:bg-surface-2"
  >
    <i :class="meta.icon" class="size-4 shrink-0" :style="{ color: meta.color }" />

    <div class="min-w-0 flex-1">
      <p class="truncate font-mono text-[13px]">
        {{ failure.error_message ?? 'No error message' }}
      </p>
      <p v-if="!compact" class="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px] text-mute">
        <span v-if="failure.pipeline">#{{ failure.pipeline.iid }}</span>
        <span v-if="failure.job_name">· {{ failure.job_name }}</span>
        <span v-if="failure.pipeline?.ref">· <span class="font-mono">{{ failure.pipeline.ref }}</span></span>
        <span>· {{ when }}</span>
      </p>
    </div>

    <PmBadge v-if="failure.is_flaky" tone="warning" size="sm">flaky</PmBadge>
    <PmBadge :tone="STATUS_TONE[failure.status] ?? 'dim'" size="sm">
      {{ failure.status }}
    </PmBadge>
  </RouterLink>
</template>
