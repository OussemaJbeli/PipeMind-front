<script setup lang="ts">
import { computed } from 'vue'

import type { ApiError } from '@/api/client'

const props = defineProps<{
  loading: boolean
  error?: ApiError | null
  empty?: boolean
  emptyTitle?: string
  emptyMessage?: string
}>()

defineEmits<{ retry: [] }>()

/**
 * Distinguish "we can't reach the server" from "your pipeline failed".
 * Conflating them is the most confusing thing a monitoring UI can do.
 */
const errorTitle = computed(() => {
  switch (props.error?.errorCode) {
    case 'AI_SERVICE_UNAVAILABLE': return 'Analysis service unavailable'
    case 'AI_BUDGET_EXCEEDED': return 'AI budget reached'
    case 'INTEGRATION_UNREACHABLE': return 'CI/CD provider unreachable'
    case 'INTEGRATION_UNAUTHORIZED': return 'Provider credentials rejected'
    case 'INSUFFICIENT_ROLE': return 'Not permitted'
    default: return 'Could not load'
  }
})
</script>

<template>
  <slot v-if="loading" name="loading">
    <PmSkeleton class="h-40 w-full" />
  </slot>

  <PmErrorState
    v-else-if="error"
    :title="errorTitle"
    :message="error.message"
    :retryable="error.retryable"
    @retry="$emit('retry')"
  />

  <PmEmptyState
    v-else-if="empty"
    :title="emptyTitle"
    :message="emptyMessage"
  >
    <slot name="empty-action" />
  </PmEmptyState>

  <slot v-else />
</template>
