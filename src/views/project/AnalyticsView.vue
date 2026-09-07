<script setup lang="ts">
import type { ApiError } from '@/api/client'
import { useAnalytics, useAnomalies, useAnomalyAction } from '@/api/queries/analytics'

const props = defineProps<{ slug: string }>()

const days = ref(30)

const { data, isPending, isError, error, refetch } = useAnalytics(() => props.slug, days)
const { data: anomalies } = useAnomalies(() => props.slug)
const act = useAnomalyAction(() => props.slug)

const rangeOptions = [
  { key: '7', label: 'Last 7 days' },
  { key: '30', label: 'Last 30 days' },
  { key: '90', label: 'Last 90 days' },
]

const range = computed({
  get: () => String(days.value),
  set: (value: string) => (days.value = Number(value)),
})

const ai = computed(() => data.value?.ai_performance)

function money(usd: number) {
  return usd < 0.01 && usd > 0 ? `$${usd.toFixed(4)}` : `$${usd.toFixed(2)}`
}

function seconds(value: number) {
  return value < 60 ? `${Math.round(value)}s` : `${Math.floor(value / 60)}m ${Math.round(value % 60)}s`
}

/**
 * CSV of the underlying rows, built in the browser from data already loaded.
 *
 * A chart you cannot get the numbers out of is a chart nobody can check — and
 * this project's report needs the numbers, not screenshots of them.
 */
function exportCsv(name: string, rows: Record<string, unknown>[]) {
  if (!rows.length)
    return

  const headers = Object.keys(rows[0]!)
  const escape = (value: unknown) => {
    const text = String(value ?? '')

    return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
  }

  const csv = [
    headers.join(','),
    ...rows.map(row => headers.map(header => escape(row[header])).join(',')),
  ].join('\n')

  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')

  link.href = url
  link.download = `${props.slug}-${name}-${days.value}d.csv`
  link.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <div class="mx-auto max-w-[1500px]">
    <div class="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 class="text-xl font-semibold">
          Analytics
        </h1>
        <p class="mt-1 text-sm text-dim">
          Where this project actually loses time.
        </p>
      </div>

      <PmSelect v-model="range" :options="rangeOptions" size="sm" />
    </div>

    <PmAsyncBoundary
      :loading="isPending"
      :error="isError ? (error as unknown as ApiError) : null"
      @retry="refetch"
    >
      <template #loading>
        <div class="grid gap-4 lg:grid-cols-2">
          <PmSkeleton class="h-64" />
          <PmSkeleton class="h-64" />
          <PmSkeleton class="h-64" />
          <PmSkeleton class="h-64" />
        </div>
      </template>

      <template v-if="data" #default>
        <!-- Open anomalies first: an alert nobody sees is an alert nobody acts on. -->
        <div v-if="anomalies?.length" class="mb-5 space-y-3">
          <h2 class="text-[13px] font-semibold uppercase tracking-wide text-dim">
            Open anomalies
          </h2>
          <AnomalyCard
            v-for="anomaly in anomalies"
            :key="anomaly.uuid"
            :anomaly="anomaly"
            :pending="act.isPending.value"
            @acknowledge="act.mutate({ uuid: anomaly.uuid, action: 'acknowledge' })"
            @resolve="act.mutate({ uuid: anomaly.uuid, action: 'resolve' })"
            @false-positive="act.mutate({ uuid: anomaly.uuid, action: 'false-positive' })"
          />
        </div>

        <div class="grid gap-4 lg:grid-cols-2">
          <PmCard title="Failure heatmap" subtitle="Day of week × hour of day">
            <template #actions>
              <button
                class="text-[11px] text-accent hover:underline"
                @click="exportCsv('heatmap', Object.entries(data.heatmap.cells).flatMap(([day, hours]) =>
                  Object.entries(hours).map(([hour, count]) => ({ day, hour, count }))))"
              >
                CSV
              </button>
            </template>
            <!-- Failures clustering at 09:00 Monday and 18:00 Friday is a story
                 about merge storms and end-of-week pushes that no line chart tells. -->
            <PmHeatmap :cells="data.heatmap.cells" :max="data.heatmap.max" />
          </PmCard>

          <PmCard title="Slowest jobs" subtitle="Median duration, all branches">
            <template #actions>
              <button class="text-[11px] text-accent hover:underline" @click="exportCsv('slowest-jobs', data.slowest_jobs)">
                CSV
              </button>
            </template>

            <ul v-if="data.slowest_jobs.length" class="space-y-2">
              <li v-for="job in data.slowest_jobs" :key="job.job_name" class="flex items-center gap-3 text-[13px]">
                <span class="min-w-0 flex-1 truncate">{{ job.job_name }}</span>
                <span class="shrink-0 tnum text-dim">{{ seconds(job.median_seconds) }}</span>
                <span class="w-[70px] shrink-0 text-right text-[11px] text-mute">
                  n={{ job.sample_count }}
                </span>
              </li>
            </ul>
            <p v-else class="text-xs text-mute">Not enough successful runs to establish a baseline yet.</p>
          </PmCard>

          <PmCard title="Top recurring signatures" subtitle="One row per distinct error">
            <template #actions>
              <button class="text-[11px] text-accent hover:underline" @click="exportCsv('signatures', data.top_signatures)">
                CSV
              </button>
            </template>

            <ul v-if="data.top_signatures.length" class="space-y-2.5">
              <li v-for="sig in data.top_signatures" :key="sig.uuid">
                <div class="flex items-center gap-2 text-[13px]">
                  <span class="size-2 shrink-0 rounded-full" :style="{ background: sig.color ?? 'var(--pm-text-mute)' }" />
                  <span class="shrink-0 font-medium" :style="{ color: sig.color ?? undefined }">{{ sig.label }}</span>
                  <span v-if="sig.subcategory" class="min-w-0 flex-1 truncate text-dim">{{ sig.subcategory }}</span>
                  <PmBadge v-if="sig.is_known" tone="accent" size="sm">known fix</PmBadge>
                  <span class="shrink-0 font-medium tnum">{{ sig.occurrences }}</span>
                </div>
                <p class="mt-0.5 truncate pl-4 font-mono text-[11px] text-mute">{{ sig.sample_error }}</p>
              </li>
            </ul>
            <p v-else class="text-xs text-mute">No failures in this range.</p>
          </PmCard>

          <PmCard title="Flakiest jobs" subtitle="Passed and failed on the same commit">
            <template #actions>
              <button class="text-[11px] text-accent hover:underline" @click="exportCsv('flakiest', data.flakiest_jobs)">
                CSV
              </button>
            </template>

            <ul v-if="data.flakiest_jobs.length" class="space-y-2">
              <li v-for="job in data.flakiest_jobs" :key="job.job_name" class="flex items-center gap-3 text-[13px]">
                <span class="min-w-0 flex-1 truncate">{{ job.job_name }}</span>
                <span class="shrink-0 text-[11px] text-mute">{{ job.failures }} of {{ job.runs }} runs</span>
                <span class="w-[44px] shrink-0 text-right tnum text-[var(--pm-warning)]">
                  {{ Math.round(job.flip_rate * 100) }}%
                </span>
              </li>
            </ul>
            <!-- Nothing flaky is a genuinely good result, and should read as one. -->
            <p v-else class="text-xs text-mute">
              No job produced both outcomes on the same commit. Nothing flaky in this range.
            </p>
          </PmCard>

          <PmCard title="MTTR trend" subtitle="Mean time to resolution, per day" class="lg:col-span-2">
            <template #actions>
              <button class="text-[11px] text-accent hover:underline" @click="exportCsv('mttr', data.mttr_trend.points)">
                CSV
              </button>
            </template>

            <div v-if="data.mttr_trend.points.length" class="space-y-1.5">
              <div
                v-for="point in data.mttr_trend.points"
                :key="point.day"
                class="flex items-center gap-3 text-[12px]"
              >
                <span class="w-[86px] shrink-0 text-mute">{{ point.day }}</span>
                <span class="min-w-0 flex-1">
                  <span
                    class="block h-2 rounded-full bg-accent"
                    :style="{ width: `${Math.min(100, (point.minutes / Math.max(...data.mttr_trend.points.map(p => p.minutes))) * 100)}%` }"
                  />
                </span>
                <span class="w-[64px] shrink-0 text-right tnum text-dim">{{ point.minutes }}m</span>
                <span class="w-[52px] shrink-0 text-right text-[11px] text-mute">{{ point.resolved }} fixed</span>
              </div>
            </div>
            <p v-else class="text-xs text-mute">Nothing has been marked resolved in this range yet.</p>
          </PmCard>

          <!--
            The strip that answers "is the AI any good, and what does it cost".

            Here rather than in a separate script because these are the numbers
            the evaluation report needs, and a number you must run a script to
            see is a number nobody checks.
          -->
          <PmCard v-if="ai" title="AI performance" class="lg:col-span-2">
            <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              <div>
                <p class="text-[11px] uppercase tracking-wider text-mute">Analyses</p>
                <p class="mt-1 text-lg font-semibold tnum">{{ ai.analyses }}</p>
              </div>
              <div>
                <p class="text-[11px] uppercase tracking-wider text-mute">Avg confidence</p>
                <p class="mt-1 text-lg font-semibold tnum">{{ Math.round(ai.avg_confidence * 100) }}%</p>
              </div>
              <div>
                <p class="text-[11px] uppercase tracking-wider text-mute">Cost</p>
                <p class="mt-1 text-lg font-semibold tnum">{{ money(ai.cost_usd) }}</p>
              </div>
              <div>
                <p class="text-[11px] uppercase tracking-wider text-mute">Avg latency</p>
                <p class="mt-1 text-lg font-semibold tnum">{{ (ai.avg_latency_ms / 1000).toFixed(1) }}s</p>
              </div>
              <div>
                <p class="text-[11px] uppercase tracking-wider text-mute">Cache hits</p>
                <p class="mt-1 text-lg font-semibold tnum">{{ Math.round(ai.cache_hit_rate * 100) }}%</p>
              </div>
              <div>
                <PmTooltip content="Nobody having judged an analysis is not the same as an analysis judged unhelpful. This shows a dash until somebody says.">
                  <p class="text-[11px] uppercase tracking-wider text-mute">Helpful</p>
                </PmTooltip>
                <p class="mt-1 text-lg font-semibold tnum">
                  {{ ai.helpful_rate === null ? '—' : `${Math.round(ai.helpful_rate * 100)}%` }}
                </p>
                <p v-if="ai.helpful_rate === null" class="text-[10px] text-mute">no feedback yet</p>
              </div>
            </div>

            <div v-if="Object.keys(ai.classification_sources).length" class="mt-4 border-t pt-3">
              <p class="text-[11px] uppercase tracking-wider text-mute">Classification source</p>
              <div class="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-dim">
                <span v-for="(count, source) in ai.classification_sources" :key="source">
                  {{ source }}: <span class="tnum font-medium">{{ count }}</span>
                </span>
              </div>
            </div>
          </PmCard>
        </div>
      </template>
    </PmAsyncBoundary>
  </div>
</template>
