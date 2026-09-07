<script setup lang="ts">
import type { FailureDetail } from '@/types/api'

defineProps<{ failure: FailureDetail }>()
</script>

<template>
  <!--
    FACTS. Neutral border, neutral header, an eye icon.

    Deliberately plain: this panel must never borrow the accent treatment the
    analysis uses, because the visual difference is what tells a reader at a
    glance which half of the page is measured and which half is inferred.
  -->
  <PmCard :padded="false">
    <div class="flex flex-wrap items-center gap-2 border-b px-5 py-3">
      <i-lucide-eye class="size-4 text-dim" />
      <h3 class="text-[13px] font-semibold uppercase tracking-wide text-dim">
        Observed
      </h3>
      <span class="text-xs text-mute">— facts collected from your pipeline</span>
    </div>

    <div class="space-y-5 p-5">
      <ChangedFilesList :files="failure.observed.changed_files" />

      <PreviousPipelineNote
        :previous="failure.observed.previous_pipeline"
        :ref="failure.pipeline?.ref"
      />

      <LogViewer
        :job-uuid="failure.job?.uuid"
        :excerpt="failure.observed.log_excerpt"
        :start-line="failure.observed.log_excerpt_start_line"
        :highlight="failure.error_message"
      />
    </div>
  </PmCard>
</template>
