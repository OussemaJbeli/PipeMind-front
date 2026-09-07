<script setup lang="ts">
import { categoryMeta } from '@/composables/useCategoryMeta'
import { useRelativeTime } from '@/composables/useRelativeTime'
import type { SignatureItem } from '@/types/api'

const props = defineProps<{ signature: SignatureItem, slug: string }>()

const meta = computed(() => categoryMeta(props.signature.category))
const first = useRelativeTime(() => props.signature.first_seen_at)
const last = useRelativeTime(() => props.signature.last_seen_at)

const mttr = computed(() => {
  const seconds = props.signature.avg_resolution_seconds

  if (!seconds)
    return null

  const minutes = Math.round(seconds / 60)

  return minutes < 60 ? `${minutes}m` : `${Math.round(minutes / 60)}h`
})
</script>

<template>
  <component
    :is="signature.latest_failure_uuid ? 'RouterLink' : 'div'"
    v-bind="signature.latest_failure_uuid
      ? { to: { name: 'project.failure', params: { slug, uuid: signature.latest_failure_uuid } } }
      : {}"
    class="block rounded-[var(--pm-radius)] border bg-surface p-4 transition-colors"
    :class="signature.latest_failure_uuid ? 'hover:bg-surface-2' : ''"
  >
    <div class="flex flex-wrap items-center gap-2">
      <i :class="meta.icon" class="size-4 shrink-0" :style="{ color: meta.color }" />
      <span class="text-[13px] font-medium" :style="{ color: meta.color }">
        {{ meta.label }}
        <span v-if="signature.subcategory" class="text-dim">· {{ signature.subcategory }}</span>
      </span>

      <!-- A confirmed fix is the whole payoff of keeping history: the next
           occurrence short-circuits to it with no model call at all. -->
      <PmBadge v-if="signature.is_known" tone="accent" size="sm">known fix</PmBadge>

      <span class="ml-auto shrink-0 text-[13px] font-semibold tnum">
        {{ signature.occurrences }}
        <span class="text-[11px] font-normal text-mute">
          occurrence{{ signature.occurrences === 1 ? '' : 's' }}
        </span>
      </span>
    </div>

    <p class="mt-2 break-words font-mono text-[12px] text-dim">
      {{ signature.sample_error }}
    </p>

    <p class="mt-2 flex flex-wrap items-center gap-x-2 text-[11px] text-mute">
      <span>First seen {{ first }}</span>
      <span>· last {{ last }}</span>
      <span>· {{ signature.resolved_count }} of {{ signature.occurrences }} resolved</span>
      <span v-if="mttr">· avg {{ mttr }} to fix</span>
      <span class="font-mono">· {{ signature.hash }}</span>
    </p>

    <div
      v-if="signature.known_resolution"
      class="mt-2.5 flex items-start gap-1.5 rounded-[var(--pm-radius-sm)] bg-surface-2 px-2.5 py-2 text-xs text-accent"
    >
      <i-lucide-check class="mt-0.5 size-3 shrink-0" />
      <span>{{ signature.known_resolution }}</span>
    </div>
  </component>
</template>
