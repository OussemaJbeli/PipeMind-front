<script setup lang="ts">
import { PIPELINE_STATUS_META } from '@/composables/useStatusMeta'
import type { PipelineJob } from '@/types/api'

const props = defineProps<{ job: PipelineJob }>()

const meta = computed(() =>
  PIPELINE_STATUS_META[props.job.status as keyof typeof PIPELINE_STATUS_META]
  ?? PIPELINE_STATUS_META.queued,
)

const failed = computed(() => props.job.status === 'failed')

function duration(seconds: number | null) {
  if (seconds === null)
    return '—'

  return seconds < 60 ? `${seconds}s` : `${Math.floor(seconds / 60)}m ${seconds % 60}s`
}
</script>

<template>
  <div
    class="rounded-[var(--pm-radius)] border px-3 py-2 transition-colors"
    :class="failed ? 'border-[color:var(--pm-danger)]/40' : ''"
    :style="failed ? { background: meta.bg } : {}"
  >
    <div class="flex items-center gap-1.5">
      <i :class="[meta.icon, meta.spin && 'animate-spin']" class="size-3.5 shrink-0" :style="{ color: meta.color }" />
      <span class="min-w-0 flex-1 truncate text-[12px] font-medium">{{ job.name }}</span>
    </div>

    <p class="mt-1 flex items-center gap-2 text-[11px] text-mute">
      <span class="tnum">{{ duration(job.duration_seconds) }}</span>
      <!-- allow_failure means a red job that did NOT break the pipeline. Without
           saying so, the graph shows a failure the user cannot find a cause for. -->
      <span v-if="job.allow_failure" class="text-[10px]">allowed to fail</span>
      <span v-else-if="job.exit_code !== null && failed" class="text-[var(--pm-danger)]">
        exit {{ job.exit_code }}
      </span>
    </p>
  </div>
</template>
