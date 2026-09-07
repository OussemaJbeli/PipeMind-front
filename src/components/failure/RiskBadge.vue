<script setup lang="ts">
import type { Severity } from '@/types/domain'

const props = defineProps<{ risk: Severity }>()

/**
 * Risk is assigned by the backend from `action_type`, never by the model.
 *
 * The tooltip says so, because a user weighing an automated action needs to know
 * the label is a property of the action type and not a judgement the AI made
 * about its own suggestion.
 */
const EXPLAIN: Record<string, string> = {
  low: 'Safe to run. Reversible, and cannot affect production.',
  medium: 'Changes files or configuration. Review the diff before applying.',
  high: 'Touches configuration or the default branch. Needs a human decision.',
  critical: 'Could affect production or destroy data. Never applied automatically.',
}

const TONE: Record<string, 'accent' | 'warning' | 'danger' | 'neutral'> = {
  low: 'accent',
  medium: 'warning',
  high: 'warning',
  critical: 'danger',
}

const tone = computed(() => TONE[props.risk] ?? 'neutral')
</script>

<template>
  <PmTooltip :content="`${EXPLAIN[risk] ?? ''} Risk is set by PipeMind from the action type, not by the model.`">
    <PmBadge :tone="tone" size="sm">
      {{ risk }} risk
    </PmBadge>
  </PmTooltip>
</template>
