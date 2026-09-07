<script setup lang="ts">
import { useRelativeTime } from '@/composables/useRelativeTime'
import type { AnomalyItem } from '@/types/api'

const props = defineProps<{ anomaly: AnomalyItem, pending?: boolean }>()

defineEmits<{ acknowledge: [], resolve: [], falsePositive: [] }>()

const when = useRelativeTime(() => props.anomaly.detected_at)

const TONE: Record<string, 'danger' | 'warning' | 'neutral'> = {
  critical: 'danger',
  high: 'danger',
  medium: 'warning',
  low: 'neutral',
}

const TYPE_ICON: Record<string, string> = {
  duration: 'i-lucide-timer',
  memory: 'i-lucide-cpu',
  failure_rate: 'i-lucide-trending-up',
  retry_rate: 'i-lucide-refresh-cw',
  queue_time: 'i-lucide-hourglass',
  test_count: 'i-lucide-flask-conical-off',
  log_size: 'i-lucide-scroll-text',
  flaky_test: 'i-lucide-shuffle',
}

function display(value: number, metric: string) {
  if (metric.includes('duration') || metric.includes('queue'))
    return value < 60 ? `${Math.round(value)}s` : `${Math.floor(value / 60)}m ${Math.round(value % 60)}s`

  if (metric.includes('memory'))
    return `${Math.round(value)} MB`

  if (metric.includes('rate'))
    return `${Math.round(value * 100)}%`

  return value.toLocaleString()
}

const settled = computed(() =>
  props.anomaly.status === 'resolved' || props.anomaly.status === 'false_positive',
)
</script>

<template>
  <PmCard>
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div class="flex min-w-0 flex-1 items-start gap-2.5">
        <i :class="TYPE_ICON[anomaly.type] ?? 'i-lucide-activity'" class="mt-0.5 size-4 shrink-0 text-[var(--pm-warning)]" />
        <div class="min-w-0">
          <h3 class="text-[13px] font-semibold leading-snug">
            {{ anomaly.title }}
          </h3>
          <p v-if="anomaly.description" class="mt-1 text-xs leading-relaxed text-dim">
            {{ anomaly.description }}
          </p>
        </div>
      </div>

      <div class="flex shrink-0 items-center gap-2">
        <PmBadge :tone="TONE[anomaly.severity] ?? 'neutral'" size="sm">{{ anomaly.severity }}</PmBadge>
        <PmBadge v-if="anomaly.status === 'acknowledged'" tone="dim" size="sm">acknowledged</PmBadge>
        <PmBadge v-else-if="anomaly.status === 'false_positive'" tone="dim" size="sm">not an issue</PmBadge>
      </div>
    </div>

    <!--
      Observed, baseline, deviation AND the sample size.

      The sample size is not decoration: "4.1× slower than a median of 47 runs"
      is a claim a reader can weigh, while "4.1× slower" alone could be measured
      against three runs and mean nothing.
    -->
    <dl class="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 border-t pt-3 text-xs sm:grid-cols-4">
      <div>
        <dt class="text-mute">Observed</dt>
        <dd class="mt-0.5 font-medium tnum">{{ display(anomaly.observed_value, anomaly.metric_name) }}</dd>
      </div>
      <div>
        <dt class="text-mute">Baseline</dt>
        <dd class="mt-0.5 tnum text-dim">{{ display(anomaly.baseline_value, anomaly.metric_name) }}</dd>
      </div>
      <div v-if="anomaly.deviation_ratio !== null">
        <dt class="text-mute">Deviation</dt>
        <dd class="mt-0.5 font-medium tnum">{{ anomaly.deviation_ratio }}×</dd>
      </div>
      <div v-if="anomaly.z_score !== null">
        <dt class="text-mute">
          <PmTooltip content="Modified z-score, computed from the median absolute deviation. Robust to the one dead-runner outlier that would otherwise hide every real anomaly.">
            <span>z-score</span>
          </PmTooltip>
        </dt>
        <dd class="mt-0.5 tnum text-dim">{{ anomaly.z_score }}</dd>
      </div>
    </dl>

    <div v-if="anomaly.possible_causes.length" class="mt-3">
      <p class="text-[11px] font-semibold uppercase tracking-wider text-mute">Possible causes</p>
      <ul class="mt-1.5 space-y-0.5">
        <li v-for="cause in anomaly.possible_causes" :key="cause" class="flex items-start gap-1.5 text-xs text-dim">
          <span class="mt-1.5 size-1 shrink-0 rounded-full bg-[var(--pm-text-mute)]" />
          {{ cause }}
        </li>
      </ul>
    </div>

    <div class="mt-3 flex flex-wrap items-center gap-2 border-t pt-3">
      <span class="text-[11px] text-mute">Detected {{ when }}</span>

      <div v-if="!settled" class="ml-auto flex flex-wrap gap-2">
        <PmButton
          v-if="anomaly.status !== 'acknowledged'"
          size="sm" variant="secondary" :disabled="pending"
          @click="$emit('acknowledge')"
        >
          Acknowledge
        </PmButton>
        <PmButton size="sm" variant="ghost" :disabled="pending" @click="$emit('resolve')">
          Resolve
        </PmButton>
        <!-- First-class, not a hidden dismiss: this is what tunes the thresholds. -->
        <PmButton size="sm" variant="ghost" :disabled="pending" @click="$emit('falsePositive')">
          Not an issue
        </PmButton>
      </div>
    </div>
  </PmCard>
</template>
