<script setup lang="ts">
withDefaults(defineProps<{
  options: ReadonlyArray<{ key: string, label?: string, icon?: string }>
  size?: 'sm' | 'md'
  ariaLabel?: string
}>(), { size: 'md' })

const model = defineModel<string>({ required: true })
</script>

<template>
  <div
    class="inline-flex items-center gap-0.5 rounded-[var(--pm-radius)] border bg-surface-2 p-0.5"
    role="tablist"
    :aria-label="ariaLabel"
  >
    <button
      v-for="option in options"
      :key="option.key"
      role="tab"
      :aria-selected="model === option.key"
      :aria-label="option.label ?? option.key"
      class="inline-flex items-center gap-1.5 rounded-[calc(var(--pm-radius)-3px)] font-medium transition-colors"
      :class="[
        size === 'sm' ? 'h-7 px-2.5 text-[12px]' : 'h-8 px-3 text-[13px]',
        model === option.key
          ? 'bg-surface text-fg shadow-[var(--pm-shadow)]'
          : 'text-dim hover:text-fg',
      ]"
      @click="model = option.key"
    >
      <i v-if="option.icon" :class="option.icon" class="size-3.5" />
      <span v-if="option.label">{{ option.label }}</span>
    </button>
  </div>
</template>
