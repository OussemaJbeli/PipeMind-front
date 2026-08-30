<script setup lang="ts">
import { useId } from 'vue'

defineProps<{ label?: string, description?: string, disabled?: boolean }>()

const model = defineModel<boolean>({ default: false })
const id = useId()
</script>

<template>
  <label :for="id" class="flex cursor-pointer items-start gap-3" :class="disabled && 'opacity-50'">
    <button
      :id="id"
      type="button"
      role="switch"
      :aria-checked="model"
      :disabled="disabled"
      class="relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition-colors"
      :style="{ background: model ? 'var(--pm-accent)' : 'var(--pm-surface-3)' }"
      @click="model = !model"
    >
      <span
        class="absolute top-0.5 size-4 rounded-full bg-white transition-[left] duration-200"
        :style="{ left: model ? '18px' : '2px' }"
      />
    </button>

    <span v-if="label" class="min-w-0">
      <span class="block text-[13px] font-medium">{{ label }}</span>
      <span v-if="description" class="mt-0.5 block text-xs text-dim">{{ description }}</span>
    </span>
  </label>
</template>
