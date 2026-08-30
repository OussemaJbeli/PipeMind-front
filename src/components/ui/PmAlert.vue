<script setup lang="ts">
withDefaults(defineProps<{
  tone?: 'info' | 'success' | 'warning' | 'danger' | 'accent'
}>(), { tone: 'info' })

const TONES = {
  info: { color: 'var(--pm-info)', icon: 'i-lucide-info' },
  success: { color: 'var(--pm-success)', icon: 'i-lucide-circle-check' },
  warning: { color: 'var(--pm-warning)', icon: 'i-lucide-triangle-alert' },
  danger: { color: 'var(--pm-danger)', icon: 'i-lucide-circle-alert' },
  accent: { color: 'var(--pm-accent)', icon: 'i-lucide-sparkles' },
} as const
</script>

<template>
  <div
    class="flex items-start gap-2.5 rounded-[var(--pm-radius)] border px-3.5 py-2.5 text-[13px] leading-relaxed"
    :style="{
      borderColor: `color-mix(in srgb, ${TONES[tone].color} 30%, transparent)`,
      background: `color-mix(in srgb, ${TONES[tone].color} 8%, transparent)`,
      color: TONES[tone].color,
    }"
  >
    <i :class="TONES[tone].icon" class="mt-0.5 size-4 shrink-0" />
    <div class="min-w-0 flex-1"><slot /></div>
  </div>
</template>
