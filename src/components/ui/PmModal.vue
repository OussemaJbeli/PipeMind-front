<script setup lang="ts">
import { onKeyStroke } from '@vueuse/core'

withDefaults(defineProps<{
  title?: string
  size?: 'md' | 'lg'
}>(), { size: 'md' })

const emit = defineEmits<{ close: [] }>()

// Escape closes. A dialog that traps you until you find the right button is
// hostile, and the buttons here are consequential enough that a way out matters.
onKeyStroke('Escape', () => emit('close'))
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-[8vh]"
      @click.self="emit('close')"
    >
      <div
        class="w-full overflow-hidden rounded-[var(--pm-radius-lg)] border bg-surface shadow-2xl"
        :class="size === 'lg' ? 'max-w-3xl' : 'max-w-lg'"
        role="dialog"
        aria-modal="true"
        :aria-label="title"
      >
        <div v-if="title || $slots.header" class="flex items-start gap-3 border-b px-5 py-4">
          <slot name="header">
            <h2 class="min-w-0 flex-1 text-[15px] font-semibold">{{ title }}</h2>
          </slot>
          <button
            class="shrink-0 rounded p-1 text-mute transition-colors hover:bg-surface-2 hover:text-fg"
            aria-label="Close"
            @click="emit('close')"
          >
            <i-lucide-x class="size-4" />
          </button>
        </div>

        <div class="px-5 py-4">
          <slot />
        </div>

        <div v-if="$slots.footer" class="flex flex-wrap justify-end gap-2 border-t bg-surface-2 px-5 py-3">
          <slot name="footer" />
        </div>
      </div>
    </div>
  </Teleport>
</template>
