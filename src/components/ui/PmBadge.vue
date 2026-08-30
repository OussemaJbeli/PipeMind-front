<script setup lang="ts">
withDefaults(defineProps<{
  tone?: 'neutral' | 'accent' | 'success' | 'danger' | 'warning' | 'ai' | 'dim'
  size?: 'sm' | 'md'
}>(), { tone: 'neutral', size: 'sm' })

const TONES = {
  neutral: 'var(--pm-text-dim)',
  accent: 'var(--pm-accent)',
  success: 'var(--pm-success)',
  danger: 'var(--pm-danger)',
  warning: 'var(--pm-warning)',
  ai: 'var(--pm-ai)',
  dim: 'var(--pm-text-mute)',
} as const
</script>

<template>
  <span
    class="inline-flex items-center gap-1 rounded-md font-medium"
    :class="size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-[11px]'"
    :style="{
      color: TONES[tone],
      background: `color-mix(in srgb, ${TONES[tone]} 14%, transparent)`,
    }"
  >
    <slot />
  </span>
</template>
