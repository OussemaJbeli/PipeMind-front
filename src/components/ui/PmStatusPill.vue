<script setup lang="ts">
import { computed } from 'vue'

import { PIPELINE_STATUS_META } from '@/composables/useStatusMeta'
import type { PipelineStatus } from '@/types/domain'

const props = withDefaults(defineProps<{
  status: PipelineStatus
  size?: 'sm' | 'md'
}>(), { size: 'md' })

const meta = computed(() => PIPELINE_STATUS_META[props.status] ?? PIPELINE_STATUS_META.queued)
</script>

<template>
  <span
    class="inline-flex items-center gap-1.5 rounded-md font-medium"
    :class="size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'"
    :style="{ color: meta.color, background: meta.bg }"
  >
    <i :class="[meta.icon, meta.spin && 'animate-spin']" class="size-3 shrink-0" />
    {{ meta.label }}
  </span>
</template>
