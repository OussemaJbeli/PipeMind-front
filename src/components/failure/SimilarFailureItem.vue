<script setup lang="ts">
import { useRelativeTime } from '@/composables/useRelativeTime'
import type { SimilarFailure } from '@/types/api'

const props = defineProps<{ item: SimilarFailure, slug: string }>()

const when = useRelativeTime(() => props.item.occurred_at)
</script>

<template>
  <RouterLink
    :to="{ name: 'project.failure', params: { slug, uuid: item.uuid } }"
    class="block rounded-[var(--pm-radius)] border p-3 transition-colors hover:bg-surface-2"
  >
    <div class="flex items-center justify-between gap-2">
      <span class="flex items-center gap-2">
        <SimilarityRing :value="item.similarity" />
        <span class="text-[13px] font-medium">{{ Math.round(item.similarity * 100) }}% similar</span>
      </span>
      <span class="shrink-0 text-[11px] text-mute">{{ when }}</span>
    </div>

    <p v-if="item.root_cause" class="mt-2 line-clamp-2 text-xs text-dim">
      {{ item.root_cause }}
    </p>

    <!--
      A resolved neighbour is the useful one — it carries an answer someone
      already paid for. An unresolved one is context, and saying so stops the
      reader treating a 94% match as a proven fix.
    -->
    <p v-if="item.resolved" class="mt-2 flex items-start gap-1.5 text-xs text-accent">
      <i-lucide-check class="mt-0.5 size-3 shrink-0" />
      <span class="line-clamp-2">Fixed by: {{ item.resolution ?? 'resolution not recorded' }}</span>
    </p>
    <p v-else class="mt-2 text-xs text-mute">
      Never resolved
    </p>
  </RouterLink>
</template>
