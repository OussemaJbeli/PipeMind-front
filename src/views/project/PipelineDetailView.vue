<script setup lang="ts">
import type { ApiError } from '@/api/client'
import { usePipeline } from '@/api/queries/pipelines'
import { categoryMeta } from '@/composables/useCategoryMeta'
import { PIPELINE_STATUS_META } from '@/composables/useStatusMeta'
import { useRelativeTime } from '@/composables/useRelativeTime'

const props = defineProps<{ slug: string, iid: string }>()

const { data: pipeline, isPending, isError, error, refetch, active } = usePipeline(
  () => props.slug,
  () => props.iid,
)

const meta = computed(() =>
  pipeline.value ? PIPELINE_STATUS_META[pipeline.value.status] : null,
)

const when = useRelativeTime(() => pipeline.value?.finished_at ?? null)

const tab = ref<'jobs' | 'changes'>('jobs')

function duration(seconds: number | null | undefined) {
  if (seconds === null || seconds === undefined)
    return '—'

  return seconds < 60 ? `${seconds}s` : `${Math.floor(seconds / 60)}m ${seconds % 60}s`
}
</script>

<template>
  <div class="mx-auto max-w-[1500px]">
    <PmAsyncBoundary
      :loading="isPending"
      :error="isError ? (error as unknown as ApiError) : null"
      @retry="refetch"
    >
      <template #loading>
        <div class="space-y-5">
          <PmSkeleton class="h-24" />
          <PmSkeleton class="h-40" />
        </div>
      </template>

      <template v-if="pipeline && meta" #default>
        <PmCard>
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-2">
                <i
                  :class="[meta.icon, meta.spin && 'animate-spin']"
                  class="size-4"
                  :style="{ color: meta.color }"
                />
                <h1 class="text-[15px] font-semibold">
                  Pipeline #{{ pipeline.iid }}
                </h1>
                <span class="text-[13px]" :style="{ color: meta.color }">{{ meta.label }}</span>
                <span class="font-mono text-[12px] text-dim">{{ pipeline.ref }}</span>
                <span v-if="pipeline.commit_short_sha" class="font-mono text-[11px] text-mute">
                  {{ pipeline.commit_short_sha }}
                </span>
              </div>

              <p v-if="pipeline.commit_message" class="mt-2 text-sm text-dim">
                {{ pipeline.commit_message }}
              </p>

              <p class="mt-2 flex flex-wrap items-center gap-x-2 text-xs text-mute">
                <span v-if="pipeline.commit_author_name">{{ pipeline.commit_author_name }}</span>
                <span>· {{ pipeline.source }}</span>
                <span>· {{ duration(pipeline.duration_seconds) }}</span>
                <span>· {{ active ? 'running now' : when }}</span>
                <span>· {{ pipeline.jobs_total }} job(s)</span>
              </p>
            </div>

            <a
              v-if="pipeline.web_url"
              :href="pipeline.web_url"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex h-8 items-center gap-1.5 rounded-[var(--pm-radius)] px-3 text-[13px] font-medium text-dim transition-colors hover:bg-surface-2 hover:text-fg"
            >
              <i-lucide-external-link class="size-3.5" />
              Open in provider
            </a>
          </div>
        </PmCard>

        <!--
          The failure banner sits directly under the header, above the graph.

          A user opening a failed pipeline wants the cause, not an inventory of
          jobs. Putting the graph first would make them scroll past six green
          boxes to reach the one thing they came for.
        -->
        <RouterLink
          v-for="failure in pipeline.failures"
          :key="failure.uuid"
          :to="{ name: 'project.failure', params: { slug, uuid: failure.uuid } }"
          class="mt-5 block rounded-[var(--pm-radius-lg)] border border-[color:var(--pm-danger)]/30 bg-surface p-4 transition-colors hover:bg-surface-2"
        >
          <div class="flex flex-wrap items-center gap-2">
            <i
              :class="categoryMeta(failure.category).icon"
              class="size-4"
              :style="{ color: categoryMeta(failure.category).color }"
            />
            <span class="text-[13px] font-medium" :style="{ color: categoryMeta(failure.category).color }">
              {{ categoryMeta(failure.category).label }}
              <span v-if="failure.subcategory" class="text-dim">/ {{ failure.subcategory }}</span>
            </span>
            <PmBadge tone="danger" size="sm">{{ failure.severity }}</PmBadge>
            <span v-if="failure.job_name" class="text-[11px] text-mute">in {{ failure.job_name }}</span>
          </div>

          <p class="mt-2 break-words font-mono text-[13px] text-dim">
            {{ failure.error_message }}
          </p>

          <p class="mt-2 flex items-center gap-2 text-xs">
            <template v-if="failure.analysis_confidence !== null">
              <i-lucide-sparkles class="size-3.5 text-accent" />
              <span class="text-dim">
                Analysed · {{ Math.round(failure.analysis_confidence * 100) }}% confidence
              </span>
            </template>
            <span v-else class="text-mute">Not analysed yet</span>
            <span class="ml-auto font-medium text-accent">View full analysis →</span>
          </p>
        </RouterLink>

        <PmCard class="mt-5" title="Stages">
          <PipelineGraph
            v-if="pipeline.stages.length || pipeline.jobs.length"
            :stages="pipeline.stages"
            :jobs="pipeline.jobs"
          />
          <p v-else class="text-xs text-mute">
            No stage or job detail was recorded for this run.
          </p>
        </PmCard>

        <PmCard class="mt-5" :padded="false">
          <div class="border-b px-5 pt-4">
            <PmSegmented
              v-model="tab"
              :options="[
                { key: 'jobs', label: `Jobs (${pipeline.jobs.length})` },
                { key: 'changes', label: `Changes (${pipeline.changes.length})` },
              ]"
              size="sm"
            />
          </div>

          <div class="p-5">
            <div v-if="tab === 'jobs'" class="space-y-1.5">
              <div
                v-for="job in pipeline.jobs"
                :key="job.uuid"
                class="flex items-center gap-3 rounded-[var(--pm-radius-sm)] px-2.5 py-2 text-[13px]"
              >
                <i
                  :class="PIPELINE_STATUS_META[job.status as keyof typeof PIPELINE_STATUS_META]?.icon ?? 'i-lucide-circle'"
                  class="size-3.5 shrink-0"
                  :style="{ color: PIPELINE_STATUS_META[job.status as keyof typeof PIPELINE_STATUS_META]?.color }"
                />
                <span class="min-w-0 flex-1 truncate">{{ job.name }}</span>
                <span class="shrink-0 text-[11px] text-mute">{{ job.stage_name }}</span>
                <span class="w-[64px] shrink-0 text-right text-[12px] tnum text-dim">
                  {{ duration(job.duration_seconds) }}
                </span>
              </div>
              <p v-if="!pipeline.jobs.length" class="text-xs text-mute">
                No jobs recorded.
              </p>
            </div>

            <ChangedFilesList v-else :files="pipeline.changes" />
          </div>
        </PmCard>
      </template>
    </PmAsyncBoundary>
  </div>
</template>
