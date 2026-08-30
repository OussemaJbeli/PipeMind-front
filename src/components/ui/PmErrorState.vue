<script setup lang="ts">
withDefaults(defineProps<{
  title?: string
  message?: string
  retryable?: boolean
  compact?: boolean
}>(), { title: 'Could not load', retryable: true })

defineEmits<{ retry: [] }>()
</script>

<template>
  <div class="grid place-items-center text-center" :class="compact ? 'py-8' : 'py-14'">
    <div>
      <i-lucide-cloud-alert class="mx-auto size-6 text-[var(--pm-warning)]" />
      <p class="mt-3 text-sm font-medium">{{ title }}</p>
      <p v-if="message" class="mx-auto mt-1 max-w-md text-xs leading-relaxed text-dim">
        {{ message }}
      </p>
      <PmButton
        v-if="retryable"
        variant="secondary"
        size="sm"
        class="mt-4"
        @click="$emit('retry')"
      >
        <i-lucide-refresh-cw class="size-3.5" /> Try again
      </PmButton>
    </div>
  </div>
</template>
