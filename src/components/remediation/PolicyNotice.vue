<script setup lang="ts">
import type { PolicyDecision } from '@/api/queries/remediation'

const props = defineProps<{
  decision: PolicyDecision | null
  reason: string | null
}>()

/**
 * A gate that says "not allowed" without saying why teaches people to distrust
 * it. The reason names the limit that was hit and the value that hit it, so a
 * developer can tell what would change the answer.
 */
const meta = computed(() => {
  switch (props.decision) {
    case 'auto_allowed':
      return { tone: 'success' as const, label: 'Runs automatically' }
    case 'requires_approval':
      return { tone: 'warning' as const, label: 'Needs approval' }
    case 'forbidden':
      return { tone: 'danger' as const, label: 'Not permitted' }
    default:
      // Absent is not permission. The backend has not evaluated the gate for
      // this recommendation, and the UI must not imply it passed.
      return { tone: 'info' as const, label: 'Policy not evaluated' }
  }
})
</script>

<template>
  <PmAlert :tone="meta.tone">
    <span class="font-medium">{{ meta.label }}</span>
    <template v-if="reason"> — {{ reason }}</template>
    <template v-else-if="!decision">
      — this recommendation predates the policy engine, so apply it by hand.
    </template>
  </PmAlert>
</template>
