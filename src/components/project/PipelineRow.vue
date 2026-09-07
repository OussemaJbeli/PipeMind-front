<script setup lang="ts">
import { PIPELINE_STATUS_META } from '@/composables/useStatusMeta'
import { useRelativeTime } from '@/composables/useRelativeTime'
import type { PipelineListItem } from '@/types/api'

const props = defineProps<{ pipeline: PipelineListItem, slug: string }>()

const meta = computed(() => PIPELINE_STATUS_META[props.pipeline.status])
const when = useRelativeTime(() => props.pipeline.finished_at)

const running = computed(() =>
  props.pipeline.status === 'running' || props.pipeline.status === 'queued',
)
</script>

<template>
  <div class="rounded-[var(--pm-radius)] border bg-surface">
    <RouterLink
      :to="{ name: 'project.pipeline', params: { slug, iid: pipeline.iid } }"
      class="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 transition-colors hover:bg-surface-2"
    >
      <span class="flex w-[92px] shrink-0 items-center gap-2">
        <i
          :class="[meta.icon, running && 'animate-spin']"
          class="size-4"
          :style="{ color: meta.color }"
        />
        <span class="font-mono text-[13px] font-medium">#{{ pipeline.iid }}</span>
      </span>

      <span class="w-[88px] shrink-0 text-[13px]" :style="{ color: meta.color }">
        {{ meta.label }}
      </span>

      <span class="min-w-0 flex-1 truncate">
        <span class="font-mono text-[12px] text-dim">{{ pipeline.ref }}</span>
        <span v-if="pipeline.commit_message" class="ml-2 text-[13px] text-mute">
          {{ pipeline.commit_message }}
        </span>
      </span>

      <span class="shrink-0 font-mono text-[11px] text-mute">{{ pipeline.commit_short_sha }}</span>
      <span class="w-[72px] shrink-0 text-right text-[12px] tnum text-dim">
        {{ pipeline.duration_display ?? '—' }}
      </span>
      <span class="w-[88px] shrink-0 text-right text-[11px] text-mute">
        {{ running ? 'running' : when }}
      </span>
    </RouterLink>

    <!--
      The sub-row is the whole point of this page.

      A plain list of pipelines is what the provider already gives you. Surfacing
      the failure inline — with a direct link to the analysis — is what makes this
      list worth visiting instead.
    -->
    <RouterLink
      v-if="pipeline.has_failure && pipeline.failure_uuid"
      :to="{ name: 'project.failure', params: { slug, uuid: pipeline.failure_uuid } }"
      class="flex items-center gap-2 border-t px-4 py-2 text-[12px] transition-colors hover:bg-surface-2"
    >
      <i-lucide-triangle-alert class="size-3.5 shrink-0 text-[var(--pm-danger)]" />
      <span class="min-w-0 flex-1 truncate text-dim">Failure detected in this run</span>
      <span class="shrink-0 font-medium text-accent">View analysis →</span>
    </RouterLink>
  </div>
</template>
