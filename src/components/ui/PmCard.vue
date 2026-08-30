<script setup lang="ts">
withDefaults(defineProps<{
  title?: string
  subtitle?: string
  padded?: boolean
  hoverable?: boolean
  /** The AI Insight treatment: accent border with a soft glow. */
  glow?: boolean
}>(), { padded: true })
</script>

<template>
  <section
    class="relative rounded-[var(--pm-radius-lg)] border bg-surface transition-colors"
    :class="[
      hoverable && 'hover:border-[var(--pm-text-mute)] hover:bg-surface-2',
      glow && 'border-[color:var(--pm-accent)]/35 shadow-[0_0_28px_var(--pm-accent-glow)]',
    ]"
  >
    <header
      v-if="title || $slots.header || $slots.actions"
      class="flex items-center justify-between gap-3 px-5 pb-3 pt-4"
    >
      <slot name="header">
        <div class="min-w-0">
          <h3 v-if="title" class="truncate text-[15px] font-semibold">{{ title }}</h3>
          <p v-if="subtitle" class="mt-0.5 truncate text-xs text-dim">{{ subtitle }}</p>
        </div>
      </slot>

      <slot name="actions" />
    </header>

    <div :class="padded ? 'px-5 pb-5' : ''" :style="!title && !$slots.header && padded ? 'padding-top:1.25rem' : ''">
      <slot />
    </div>
  </section>
</template>
