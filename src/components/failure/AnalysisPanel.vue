<script setup lang="ts">
import type { Analysis, AnalysisFeedbackPayload, FailureStatus } from '@/types/api'

defineProps<{
  analysis: Analysis | null
  status: FailureStatus
  slug?: string
  feedbackPending?: boolean
}>()

defineEmits<{
  feedback: [AnalysisFeedbackPayload]
  retry: []
}>()
</script>

<template>
  <!--
    INFERENCE. Accent border, sparkles, an explicit confidence badge.

    Every state below says which thing broke. "Analysis failed" and "pipeline
    failed" are different events, and conflating them makes a working product
    look broken.
  -->

  <!-- Running. The pipeline already failed; this is a separate, ongoing job. -->
  <PmCard v-if="status === 'analyzing' || status === 'queued'" class="border-[color:var(--pm-accent)]/25">
    <div class="flex items-center gap-3 py-2">
      <i-lucide-loader-circle class="size-5 animate-spin text-accent" />
      <div>
        <p class="text-sm font-medium">
          PipeMind is analysing this failure…
        </p>
        <p class="mt-0.5 text-xs text-dim">
          Usually takes 5–10 seconds. This page updates on its own.
        </p>
      </div>
    </div>
  </PmCard>

  <!-- Analysis failed ≠ pipeline failed. Say which one broke. -->
  <PmCard v-else-if="status === 'analysis_failed'" class="border-[color:var(--pm-warning)]/30">
    <div class="flex items-start gap-3 py-1">
      <i-lucide-triangle-alert class="mt-0.5 size-5 shrink-0 text-[var(--pm-warning)]" />
      <div class="flex-1">
        <p class="text-sm font-medium">
          Analysis could not be completed
        </p>
        <p class="mt-1 text-xs text-dim">
          The pipeline failure is real — only PipeMind's analysis of it failed.
          Everything under <strong>Observed</strong> above is unaffected.
        </p>
        <p v-if="analysis?.error" class="mt-2 rounded-[var(--pm-radius-sm)] bg-surface-2 px-2.5 py-2 font-mono text-[11px] text-mute">
          {{ analysis.error }}
        </p>
        <PmButton size="sm" variant="secondary" class="mt-3" @click="$emit('retry')">
          Try again
        </PmButton>
      </div>
    </div>
  </PmCard>

  <PmCard v-else-if="analysis" :padded="false" class="border-[color:var(--pm-accent)]/25">
    <div class="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-3">
      <div class="flex items-center gap-2">
        <i-lucide-sparkles class="size-4 text-accent" />
        <h3 class="text-[13px] font-semibold uppercase tracking-wide text-accent">
          PipeMind Analysis
        </h3>
      </div>

      <ConfidenceBadge :value="analysis.confidence" />
    </div>

    <div class="space-y-5 p-5">
      <p class="text-[15px] font-medium leading-relaxed">
        {{ analysis.summary }}
      </p>

      <p class="text-sm leading-relaxed text-dim">
        {{ analysis.root_cause }}
      </p>

      <!-- Collapsed by default: the summary and root cause answer the question,
           and the reasoning is for the reader who disagrees with them. -->
      <details v-if="analysis.explanation" class="group">
        <summary class="cursor-pointer text-xs font-medium text-accent">
          More detail
        </summary>
        <p class="mt-2 whitespace-pre-line text-sm leading-relaxed text-dim">
          {{ analysis.explanation }}
        </p>
      </details>

      <EvidenceList :evidence="analysis.evidence" :slug="slug" />

      <PmAlert v-if="analysis.is_transient" tone="info">
        This looks transient. A retry may succeed without any code change.
      </PmAlert>

      <AnalysisProvenance :analysis="analysis" />

      <AnalysisFeedback
        :analysis="analysis"
        :pending="feedbackPending"
        @submit="$emit('feedback', $event)"
      />
    </div>
  </PmCard>

  <PmCard v-else class="text-center">
    <div class="py-6">
      <p class="text-sm text-dim">
        This failure hasn't been analysed yet.
      </p>
      <PmButton variant="primary" size="sm" class="mt-3" @click="$emit('retry')">
        Analyse now
      </PmButton>
    </div>
  </PmCard>
</template>
