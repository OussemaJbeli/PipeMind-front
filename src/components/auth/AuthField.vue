<script setup lang="ts">
import { computed, ref, useId } from 'vue'

const props = withDefaults(defineProps<{
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
  /** Leading icon inside the input. Adds the left padding it needs. */
  icon?: string
  /** Password fields: renders the reveal toggle. */
  revealable?: boolean
  size?: 'md' | 'lg'
}>(), { type: 'text', required: true, size: 'md' })

const model = defineModel<string>({ required: true })
const id = useId()

const revealed = ref(false)

// The reveal toggle swaps the type, so `type` cannot be bound directly.
const inputType = computed(() =>
  props.revealable && revealed.value ? 'text' : props.type)
</script>

<template>
  <div>
    <div class="mb-1.5 flex items-baseline justify-between gap-2">
      <label :for="id" class="text-[13px] font-medium">{{ label }}</label>
      <slot name="label-suffix" />
    </div>

    <div class="relative">
      <i
        v-if="icon"
        :class="icon"
        aria-hidden="true"
        class="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-mute"
      />

      <input
        :id="id"
        v-model="model"
        :type="inputType"
        :autocomplete="autocomplete"
        :placeholder="placeholder"
        :required="required"
        :autofocus="autofocus"
        :disabled="disabled"
        :aria-invalid="Boolean(errors?.length)"
        :aria-describedby="errors?.length ? `${id}-error` : hint ? `${id}-hint` : undefined"
        class="w-full rounded-[var(--pm-radius)] border bg-surface text-sm outline-none transition-colors placeholder:text-mute focus:border-[color:var(--pm-accent)]/50 disabled:opacity-60"
        :class="[
          size === 'lg' ? 'h-12' : 'h-11',
          icon ? 'pl-10' : 'pl-3.5',
          revealable ? 'pr-10' : 'pr-3.5',
          errors?.length ? 'border-[color:var(--pm-danger)]/50' : '',
        ]"
      >

      <button
        v-if="revealable"
        type="button"
        class="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-mute transition-colors hover:text-fg"
        :aria-label="revealed ? 'Hide password' : 'Show password'"
        :aria-pressed="revealed"
        @click="revealed = !revealed"
      >
        <i :class="revealed ? 'i-lucide-eye-off' : 'i-lucide-eye'" class="size-4" />
      </button>
    </div>

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
