<script setup lang="ts">
import type { Analysis } from '@/types/api'

defineProps<{ analysis: Analysis }>()

/**
 * Show the machinery.
 *
 * A developer deciding whether to trust a paragraph of generated text needs to
 * know what produced it: whether deterministic rules or a model decided the
 * category, whether the workspace's own history informed it, which model
 * answered, and what it cost. Hiding that makes the analysis look like an
 * oracle; showing it makes it a tool.
 */
const SOURCE_EXPLAIN: Record<string, string> = {
  rules: 'Category decided by deterministic pattern rules — explainable and free.',
  ml: 'Category predicted by the trained classifier.',
  hybrid: 'Rules and the classifier agreed on this category.',
  llm: 'Category decided by the language model, because neither rules nor the classifier were confident.',
}

function cost(usd: number) {
  if (!usd)
    return 'no cost'

  return usd < 0.01 ? `$${usd.toFixed(4)}` : `$${usd.toFixed(2)}`
}
</script>

<template>
  <div class="flex flex-wrap items-center gap-x-3 gap-y-1 border-t pt-3 text-[11px] text-mute">
    <PmTooltip :content="SOURCE_EXPLAIN[analysis.classification_source] ?? analysis.classification_source">
      <span class="flex items-center gap-1">
        <i-lucide-cpu class="size-3" />{{ analysis.classification_source }}
      </span>
    </PmTooltip>

    <PmTooltip
      v-if="analysis.used_rag"
      :content="analysis.similar_failures_count
        ? `Informed by ${analysis.similar_failures_count} similar past failures in this workspace`
        : 'This exact error signature has been seen before in this workspace'"
    >
      <span class="flex items-center gap-1 text-accent">
        <i-lucide-history class="size-3" />history
      </span>
    </PmTooltip>

    <span v-if="analysis.model_name">{{ analysis.model_name }}</span>
    <span v-if="analysis.latency_ms !== null">{{ (analysis.latency_ms / 1000).toFixed(1) }}s</span>
    <span>{{ cost(analysis.cost_usd) }}</span>

    <PmTooltip
      v-if="analysis.cache_hit"
      content="Reused from an earlier analysis of the same error in this project. No model was called."
    >
      <PmBadge tone="dim">cached</PmBadge>
    </PmTooltip>
  </div>
</template>
