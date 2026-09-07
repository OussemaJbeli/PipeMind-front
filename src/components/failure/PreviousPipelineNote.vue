<script setup lang="ts">
import { useRelativeTime } from '@/composables/useRelativeTime'
import type { FailureDetail } from '@/types/api'

const props = defineProps<{
  previous: FailureDetail['observed']['previous_pipeline']
  ref?: string
}>()

const when = useRelativeTime(() => props.previous?.finished_at ?? null)

const wasGreen = computed(() => props.previous?.status === 'success')
</script>

<template>
  <div v-if="previous" class="flex items-start gap-2.5 text-[13px]">
    <i
      :class="wasGreen ? 'i-lucide-circle-check text-accent' : 'i-lucide-circle-x text-[var(--pm-danger)]'"
      class="mt-0.5 size-3.5 shrink-0"
    />

    <p class="text-dim">
      Previous pipeline
      <span class="font-mono text-[12px]">#{{ previous.iid }}</span>
      <span v-if="ref"> on <span class="font-mono text-[12px]">{{ ref }}</span></span>
      <template v-if="wasGreen">
        <!-- The single highest-signal fact on this page: green until this commit
             narrows the search from "the whole repository" to "this diff". -->
        passed {{ when }}, so something in this commit is the likely cause.
      </template>
      <template v-else>
        also failed {{ when }} — this is not new breakage.
      </template>
    </p>
  </div>
</template>
