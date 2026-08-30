<script setup lang="ts">
import { computed } from 'vue'

import type { Metric } from '@/types/api'
import { deltaTone } from '@/utils/format'

const props = withDefaults(defineProps<{
  metric: Metric | undefined
  showArrow?: boolean
  size?: 'xs' | 'sm'
}>(), { showArrow: false, size: 'sm' })

const tone = computed(() =>
  deltaTone(props.metric?.delta, props.metric?.positive_direction ?? 'up'))

const TONE_CLASS = {
  positive: 'text-accent',
  negative: 'text-[var(--pm-danger)]',
  neutral: 'text-dim',
} as const

/**
 * Arrow direction and colour are independent. MTTR falling shows a DOWN arrow
 * in GREEN because the server said positive_direction is "down". Deriving the
 * colour from the arrow is the bug that makes every improvement look like a
 * regression.
 */
const arrow = computed(() =>
  (props.metric?.delta ?? 0) >= 0 ? 'i-lucide-arrow-up' : 'i-lucide-arrow-down')
</script>

<template>
  <p
    v-if="metric?.delta_label"
    class="flex items-center gap-1 font-medium"
    :class="[TONE_CLASS[tone], size === 'xs' ? 'text-[11px]' : 'text-xs']"
  >
    <i v-if="showArrow && metric.delta" :class="arrow" class="size-3 shrink-0" />
    {{ metric.delta_label }}
  </p>
</template>
