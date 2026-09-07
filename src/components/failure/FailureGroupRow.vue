<script setup lang="ts">
import { categoryMeta } from '@/composables/useCategoryMeta'
import { useRelativeTime } from '@/composables/useRelativeTime'
import type { FailureListItem } from '@/types/api'

const props = defineProps<{
  group: {
    key: string
    category: string
    subcategory: string | null
    message: string | null
    items: FailureListItem[]
    latest: FailureListItem
    resolvedCount: number
  }
  slug: string
}>()

const open = ref(false)

const meta = computed(() => categoryMeta(props.group.category))
const newest = useRelativeTime(() => props.group.latest.failed_at)

const oldest = computed(() =>
  props.group.items.reduce(
    (acc, item) => (!acc || (item.failed_at ?? '') < acc ? item.failed_at ?? '' : acc),
    '',
  ),
)

const firstSeen = useRelativeTime(oldest)

/** A group where every occurrence was resolved is a solved problem, not an alarm. */
const allResolved = computed(() => props.group.resolvedCount === props.group.items.length)
</script>

<template>
  <div class="rounded-[var(--pm-radius)] border bg-surface">
    <button
      class="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-2"
      :aria-expanded="open"
      @click="open = !open"
    >
      <i :class="meta.icon" class="size-4 shrink-0" :style="{ color: meta.color }" />

      <div class="min-w-0 flex-1">
        <p class="flex flex-wrap items-center gap-2 text-[13px] font-medium">
          <span :style="{ color: meta.color }">{{ meta.label }}</span>
          <span v-if="group.subcategory" class="text-dim">· {{ group.subcategory }}</span>
          <PmBadge v-if="allResolved" tone="accent" size="sm">resolved</PmBadge>
        </p>

        <p class="mt-0.5 truncate font-mono text-[12px] text-dim">
          {{ group.message ?? 'No error message' }}
        </p>

        <p class="mt-0.5 text-[11px] text-mute">
          First seen {{ firstSeen }} · last {{ newest }}
          <template v-if="group.resolvedCount && !allResolved">
            · {{ group.resolvedCount }} of {{ group.items.length }} resolved
          </template>
        </p>
      </div>

      <span class="shrink-0 text-[13px] font-semibold">
        {{ group.items.length }}
        <span class="text-[11px] font-normal text-mute">
          occurrence{{ group.items.length === 1 ? '' : 's' }}
        </span>
      </span>

      <i-lucide-chevron-down class="size-4 shrink-0 text-mute transition-transform" :class="open && 'rotate-180'" />
    </button>

    <div v-if="open" class="space-y-1.5 border-t px-3 py-3">
      <FailureRow
        v-for="item in group.items"
        :key="item.uuid"
        :failure="item"
        :slug="slug"
      />
    </div>
  </div>
</template>
