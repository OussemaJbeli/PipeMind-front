<script setup lang="ts">
import { useRelativeTime } from '@/composables/useRelativeTime'
import { categoryMeta } from '@/composables/useCategoryMeta'
import type { FailureDetail } from '@/types/api'

const props = defineProps<{ failure: FailureDetail, busy?: boolean }>()

defineEmits<{ resolve: [], ignore: [], reanalyse: [] }>()

const when = useRelativeTime(() => props.failure.failed_at)
const meta = computed(() => categoryMeta(props.failure.category))

const SEVERITY_TONE: Record<string, 'danger' | 'warning' | 'neutral'> = {
  critical: 'danger',
  high: 'danger',
  medium: 'warning',
  low: 'neutral',
}

const settled = computed(() =>
  props.failure.status === 'resolved' || props.failure.status === 'ignored',
)

/** "4th occurrence" reads better than "occurrence 4" and signals recurrence faster. */
const ordinal = computed(() => {
  const n = props.failure.occurrence_index
  const suffix = n % 100 >= 11 && n % 100 <= 13
    ? 'th'
    : ({ 1: 'st', 2: 'nd', 3: 'rd' } as Record<number, string>)[n % 10] ?? 'th'

  return `${n}${suffix} occurrence`
})
</script>

<template>
  <PmCard>
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div class="min-w-0 flex-1">
        <div class="flex flex-wrap items-center gap-2">
          <PmBadge :tone="SEVERITY_TONE[failure.severity] ?? 'neutral'">
            {{ failure.severity }}
          </PmBadge>

          <span class="flex items-center gap-1.5 text-[13px] font-medium" :style="{ color: meta.color }">
            <i :class="meta.icon" class="size-3.5" />
            {{ failure.category_label ?? meta.label }}
            <span v-if="failure.subcategory" class="text-dim">/ {{ failure.subcategory }}</span>
          </span>

          <PmBadge v-if="failure.occurrence_index > 1" tone="dim">{{ ordinal }}</PmBadge>
          <PmBadge v-if="failure.is_flaky" tone="warning">flaky</PmBadge>
          <PmBadge v-if="settled" tone="accent">{{ failure.status }}</PmBadge>
        </div>

        <p class="mt-2 break-words font-mono text-sm text-dim">
          {{ failure.error_message ?? 'No error message was extracted.' }}
        </p>

        <p class="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-mute">
          <RouterLink
            v-if="failure.pipeline"
            :to="{ name: 'project.overview', params: { slug: failure.project.slug } }"
            class="hover:text-accent"
          >
            Pipeline #{{ failure.pipeline.iid }}
          </RouterLink>
          <span v-if="failure.stage_name">· {{ failure.stage_name }}</span>
          <span v-if="failure.job_name">· {{ failure.job_name }}</span>
          <span v-if="failure.pipeline?.ref">· <span class="font-mono">{{ failure.pipeline.ref }}</span></span>
          <span>· {{ when }}</span>
        </p>
      </div>

      <div class="flex shrink-0 flex-wrap items-center gap-2">
        <PmButton v-if="!settled" size="sm" variant="primary" :disabled="busy" @click="$emit('resolve')">
          Mark resolved
        </PmButton>
        <PmButton v-if="!settled" size="sm" variant="ghost" :disabled="busy" @click="$emit('ignore')">
          Ignore
        </PmButton>

        <!-- `force` bypasses both the cache and any stored analysis: this is the
             escape hatch for when a user disputes what PipeMind concluded. -->
        <PmButton size="sm" variant="secondary" :disabled="busy" @click="$emit('reanalyse')">
          Re-analyse
        </PmButton>

        <a
          v-if="failure.pipeline?.web_url"
          :href="failure.pipeline.web_url"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex h-8 items-center gap-1.5 rounded-[var(--pm-radius)] px-3 text-[13px] font-medium text-dim transition-colors hover:bg-surface-2 hover:text-fg"
        >
          <i-lucide-external-link class="size-3.5" />
          Open in provider
        </a>
      </div>
    </div>

    <p v-if="failure.resolution_note" class="mt-3 rounded-[var(--pm-radius-sm)] bg-surface-2 px-3 py-2 text-xs text-dim">
      <span class="font-medium">Resolution:</span> {{ failure.resolution_note }}
    </p>
  </PmCard>
</template>
