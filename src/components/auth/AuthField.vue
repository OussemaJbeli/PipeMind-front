<script setup lang="ts">
import { useId } from 'vue'

withDefaults(defineProps<{
  label: string
  type?: string
  autocomplete?: string
  placeholder?: string
  /** Server-side messages for this field, straight from a 422. */
  errors?: string[]
  hint?: string
  required?: boolean
  autofocus?: boolean
  disabled?: boolean
}>(), { type: 'text', required: true })

const model = defineModel<string>({ required: true })
const id = useId()
</script>

<template>
  <div>
    <div class="mb-1.5 flex items-baseline justify-between gap-2">
      <label :for="id" class="text-[13px] font-medium">{{ label }}</label>
      <slot name="label-suffix" />
    </div>

    <input
      :id="id"
      v-model="model"
      :type="type"
      :autocomplete="autocomplete"
      :placeholder="placeholder"
      :required="required"
      :autofocus="autofocus"
      :disabled="disabled"
      :aria-invalid="Boolean(errors?.length)"
      :aria-describedby="errors?.length ? `${id}-error` : hint ? `${id}-hint` : undefined"
      class="h-11 w-full rounded-[var(--pm-radius)] border bg-surface px-3.5 text-sm outline-none transition-colors placeholder:text-mute focus:border-[color:var(--pm-accent)]/50 disabled:opacity-60"
      :class="errors?.length ? 'border-[color:var(--pm-danger)]/50' : ''"
    >

    <!-- Server errors win over the hint: the hint says what is allowed, the
         error says what was actually wrong, and showing both is noise. -->
    <p v-if="errors?.length" :id="`${id}-error`" class="mt-1.5 text-xs text-[var(--pm-danger)]">
      {{ errors[0] }}
    </p>
    <p v-else-if="hint" :id="`${id}-hint`" class="mt-1.5 text-xs text-mute">
      {{ hint }}
    </p>

    <slot name="below" />
  </div>
</template>
