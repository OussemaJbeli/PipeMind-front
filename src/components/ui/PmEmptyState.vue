<script setup lang="ts">
withDefaults(defineProps<{
  icon?: string
  title?: string
  message?: string
  compact?: boolean
}>(), { icon: 'i-lucide-inbox', title: 'Nothing here yet' })
</script>

<template>
  <div class="grid place-items-center text-center" :class="compact ? 'py-8' : 'py-14'">
    <div>
      <i :class="icon" class="mx-auto size-6 text-mute" />
      <p class="mt-3 text-sm font-medium">{{ title }}</p>
      <p v-if="message" class="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-dim">
        {{ message }}
      </p>
      <div v-if="$slots.default" class="mt-4">
        <slot />
      </div>
    </div>
  </div>
</template>
