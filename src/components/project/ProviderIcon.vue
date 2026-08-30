<script setup lang="ts">
import type { ProviderType } from '@/types/domain'

defineProps<{ provider: ProviderType | null | undefined }>()

const COLORS = {
  gitlab: '#FC6D26',
  github: 'currentColor',
  jenkins: '#D33833',
  generic: 'currentColor',
} as const
</script>

<template>
  <i-simple-icons-gitlab v-if="provider === 'gitlab'" :style="{ color: COLORS.gitlab }" />
  <i-simple-icons-github v-else-if="provider === 'github'" />
  <i-simple-icons-jenkins v-else-if="provider === 'jenkins'" :style="{ color: COLORS.jenkins }" />
  <i-lucide-webhook v-else />
</template>
