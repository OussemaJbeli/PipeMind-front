<script setup lang="ts">
import type { PipelineJob, PipelineStage } from '@/types/api'

const props = defineProps<{ stages: PipelineStage[], jobs: PipelineJob[] }>()

/**
 * Horizontal stage flow with jobs stacked inside each stage.
 *
 * Deliberately NOT a generic DAG renderer: GitLab, GitHub and Jenkins all model
 * a pipeline as ordered stages containing parallel jobs, and that is exactly
 * what the normalized schema stores. A dependency graph would draw relationships
 * that are never ingested — lines the data cannot support.
 */
function jobsFor(stage: PipelineStage) {
  return props.jobs.filter(job => job.stage_name === stage.name)
}

// Jobs whose stage was never recorded would otherwise vanish from the graph.
const orphans = computed(() => {
  const named = new Set(props.stages.map(s => s.name))

  return props.jobs.filter(job => !job.stage_name || !named.has(job.stage_name))
})
</script>

<template>
  <div class="flex items-start gap-2 overflow-x-auto pb-2">
    <template v-for="(stage, index) in stages" :key="stage.name">
      <div class="min-w-[148px] shrink-0">
        <p class="mb-2 truncate text-[11px] font-medium uppercase tracking-wide text-mute">
          {{ stage.name }}
        </p>
        <div class="space-y-2">
          <JobNode v-for="job in jobsFor(stage)" :key="job.uuid" :job="job" />
        </div>
      </div>

      <i-lucide-chevron-right
        v-if="index < stages.length - 1"
        class="mt-7 size-4 shrink-0 text-mute"
      />
    </template>

    <div v-if="orphans.length" class="min-w-[148px] shrink-0">
      <p class="mb-2 text-[11px] font-medium uppercase tracking-wide text-mute">
        Ungrouped
      </p>
      <div class="space-y-2">
        <JobNode v-for="job in orphans" :key="job.uuid" :job="job" />
      </div>
    </div>
  </div>
</template>
