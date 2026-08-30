<script setup lang="ts">
import { computed } from 'vue'
import type { RouteLocationRaw } from 'vue-router'

import { useRelativeTime } from '@/composables/useRelativeTime'
import type { ActivityItem as Item } from '@/types/api'

const props = defineProps<{ item: Item, showProject?: boolean }>()

/**
 * The fixed action vocabulary from the schema. Unknown actions degrade to a
 * neutral dot rather than throwing, so the backend can add actions without
 * shipping a frontend release.
 */
const ACTION_META: Record<string, { icon: string, color: string }> = {
  'pipeline.started': { icon: 'i-lucide-play', color: 'var(--pm-running)' },
  'pipeline.succeeded': { icon: 'i-lucide-circle-check', color: 'var(--pm-success)' },
  'pipeline.failed': { icon: 'i-lucide-circle-alert', color: 'var(--pm-danger)' },
  'pipeline.canceled': { icon: 'i-lucide-circle-slash', color: 'var(--pm-text-mute)' },
  'job.failed': { icon: 'i-lucide-triangle-alert', color: 'var(--pm-warning)' },
  'job.retried': { icon: 'i-lucide-refresh-cw', color: 'var(--pm-running)' },
  'failure.detected': { icon: 'i-lucide-triangle-alert', color: 'var(--pm-danger)' },
  'failure.resolved': { icon: 'i-lucide-circle-check', color: 'var(--pm-success)' },
  'analysis.completed': { icon: 'i-lucide-sparkles', color: 'var(--pm-ai)' },
  'analysis.failed': { icon: 'i-lucide-sparkles', color: 'var(--pm-warning)' },
  'anomaly.detected': { icon: 'i-lucide-activity', color: 'var(--pm-warning)' },
  'remediation.approved': { icon: 'i-lucide-shield-check', color: 'var(--pm-accent)' },
  'remediation.succeeded': { icon: 'i-lucide-wrench', color: 'var(--pm-success)' },
  'integration.error': { icon: 'i-lucide-plug-zap', color: 'var(--pm-danger)' },
  'member.joined': { icon: 'i-lucide-user-plus', color: 'var(--pm-text-dim)' },
}

const meta = computed(() =>
  ACTION_META[props.item.action] ?? { icon: 'i-lucide-circle', color: 'var(--pm-text-mute)' })

const time = useRelativeTime(() => props.item.created_at)

const to = computed<RouteLocationRaw | undefined>(() => {
  const slug = props.item.project?.slug
  if (!slug)
    return undefined

  return { name: 'project.overview', params: { slug } }
})
</script>

<template>
  <component
    :is="to ? 'RouterLink' : 'div'"
    :to="to"
    class="flex gap-3 px-4 py-3 transition-colors"
    :class="to && 'hover:bg-surface-2'"
  >
    <span
      class="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full border"
      :style="{
        borderColor: `color-mix(in srgb, ${meta.color} 35%, transparent)`,
        background: `color-mix(in srgb, ${meta.color} 10%, transparent)`,
      }"
    >
      <i :class="meta.icon" class="size-4" :style="{ color: meta.color }" />
    </span>

    <div class="min-w-0 flex-1">
      <div class="flex items-baseline justify-between gap-2">
        <p class="truncate text-[13px] font-medium">{{ item.title }}</p>
        <time class="shrink-0 text-[11px] text-mute" :datetime="item.created_at">{{ time }}</time>
      </div>

      <p v-if="item.description" class="mt-0.5 line-clamp-2 text-xs leading-relaxed text-dim">
        {{ item.description }}
      </p>
    </div>
  </component>
</template>
