<script setup lang="ts">
import { useId } from 'vue'

withDefaults(defineProps<{
  options: ReadonlyArray<{ key: string, label: string }>
  label?: string
  icon?: string
  size?: 'sm' | 'md'
  disabled?: boolean
}>(), { size: 'md' })

const model = defineModel<string>({ required: true })
const id = useId()
</script>

<template>
  <div>
    <label v-if="label" :for="id" class="mb-1.5 block text-[13px] font-medium">{{ label }}</label>

    <div class="relative">
      <i
        v-if="icon"
        :class="icon"
        class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-dim"
      />

      <select
        :id="id"
        v-model="model"
        :disabled="disabled"
        class="w-full appearance-none rounded-[var(--pm-radius)] border bg-surface-2 font-medium outline-none transition-colors focus:border-[color:var(--pm-accent)]/50 disabled:opacity-50"
        :class="[
          size === 'sm' ? 'h-8 text-[13px]' : 'h-10 text-sm',
          icon ? 'pl-9 pr-8' : 'pl-3.5 pr-8',
        ]"
      >
        <option v-for="option in options" :key="option.key" :value="option.key">
          {{ option.label }}
        </option>
      </select>

      <i-lucide-chevron-down
        class="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-mute"
      />
    </div>
  </div>
</template>
