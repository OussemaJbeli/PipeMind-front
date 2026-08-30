<script setup lang="ts">
withDefaults(defineProps<{
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  disabled?: boolean
  block?: boolean
  type?: 'button' | 'submit' | 'reset'
}>(), { variant: 'secondary', size: 'md', type: 'button' })

const SIZES = {
  sm: 'h-8 px-3 text-[13px] gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-[15px] gap-2',
} as const

const VARIANTS = {
  primary: 'bg-accent text-[var(--pm-on-accent)] font-semibold hover:bg-[var(--pm-accent-hi)]',
  secondary: 'bg-surface-2 text-fg border hover:bg-surface-3',
  ghost: 'text-dim hover:bg-surface-2 hover:text-fg',
  outline: 'border border-[color:var(--pm-accent)]/40 text-accent hover:bg-[var(--pm-accent-dim)]',
  danger: 'bg-[color:var(--pm-danger)]/12 text-[var(--pm-danger)] border border-[color:var(--pm-danger)]/30 hover:bg-[color:var(--pm-danger)]/20',
} as const
</script>

<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    class="inline-flex items-center justify-center rounded-[var(--pm-radius)] font-medium transition-all disabled:cursor-not-allowed disabled:opacity-45"
    :class="[block && 'w-full', SIZES[size], VARIANTS[variant]]"
  >
    <i-lucide-loader-circle v-if="loading" class="size-4 shrink-0 animate-spin" />
    <slot />
  </button>
</template>
