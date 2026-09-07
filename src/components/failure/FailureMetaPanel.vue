<script setup lang="ts">
import type { FailureDetail } from '@/types/api'

const props = defineProps<{ failure: FailureDetail }>()

const rows = computed(() => [
  { label: 'Job', value: props.failure.job_name },
  { label: 'Stage', value: props.failure.stage_name },
  { label: 'Exit code', value: props.failure.exit_code?.toString() },
  { label: 'Ecosystem', value: props.failure.ecosystem },
  { label: 'Error type', value: props.failure.error_type },
  { label: 'Commit', value: props.failure.pipeline?.commit_short_sha },
].filter(row => row.value))
</script>

<template>
  <PmCard v-if="rows.length" title="Details">
    <dl class="space-y-2">
      <div v-for="row in rows" :key="row.label" class="flex items-baseline justify-between gap-3 text-xs">
        <dt class="text-mute">
          {{ row.label }}
        </dt>
        <dd class="truncate font-mono text-[12px] text-dim">
          {{ row.value }}
        </dd>
      </div>
    </dl>
  </PmCard>
</template>
