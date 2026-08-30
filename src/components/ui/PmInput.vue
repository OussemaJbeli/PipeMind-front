<script setup lang="ts">
import { useId } from 'vue'

withDefaults(defineProps<{
  label?: string
  type?: string
  placeholder?: string
  icon?: string
  error?: string
  hint?: string
  required?: boolean
  disabled?: boolean
  autocomplete?: string
}>(), { type: 'text' })

const model = defineModel<string>({ default: '' })
const id = useId()
</script>

<template>
  <div>
    <div v-if="label" class="mb-1.5 flex items-baseline justify-between gap-2">
      <label :for="id" class="text-[13px] font-medium">{{ label }}</label>
      <slot name="label-suffix" />
    </div>

    <div class="relative">
      <i
        v-if="icon"
        :class="icon"
        class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-mute"
      />
      <input
        :id="id"
        v-model="model"
        :type="type"
        :placeholder="placeholder"
        :required="required"
        :disabled="disabled"
        :autocomplete="autocomplete"
        :aria-invalid="Boolean(error)"
        :aria-describedby="error ? `${id}-error` : undefined"
        class="h-10 w-full rounded-[var(--pm-radius)] border bg-surface text-sm outline-none transition-colors placeholder:text-mute focus:border-[color:var(--pm-accent)]/50 disabled:opacity-50"
        :class="[icon ? 'pl-9 pr-3' : 'px-3.5', error && 'border-[color:var(--pm-danger)]/60']"
      >
    </div>

    <p v-if="error" :id="`${id}-error`" class="mt-1.5 text-xs text-[var(--pm-danger)]">
      {{ error }}
    </p>
    <p v-else-if="hint" class="mt-1.5 text-xs text-dim">{{ hint }}</p>
  </div>
</template>
