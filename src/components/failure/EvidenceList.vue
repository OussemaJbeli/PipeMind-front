<script setup lang="ts">
import type { Evidence } from '@/types/api'

defineProps<{ evidence: Evidence[], slug?: string }>()

const EVIDENCE_ICON: Record<Evidence['type'], string> = {
  log_line: 'i-lucide-terminal',
  changed_file: 'i-lucide-file-diff',
  historical_failure: 'i-lucide-history',
  metric: 'i-lucide-activity',
  config: 'i-lucide-settings-2',
  commit: 'i-lucide-git-commit',
  doc: 'i-lucide-book-open',
}

/**
 * Only historical-failure evidence can currently be navigated to; the rest are
 * labelled but not linked.
 *
 * A link that goes nowhere is worse than no link — it makes an unverifiable
 * claim look checkable, which is the exact failure mode this panel exists to
 * prevent.
 */
function target(item: Evidence, slug?: string) {
  if (item.type === 'historical_failure' && item.related_failure_uuid && slug) {
    return {
      name: 'project.failure',
      params: { slug, uuid: item.related_failure_uuid },
    }
  }

  return null
}

/** `job_logs#L1294` → `L1294`; anything else is shown as the backend wrote it. */
function shortRef(item: Evidence) {
  if (item.line_number)
    return `L${item.line_number}`

  const ref = item.source_ref ?? ''

  return ref.includes('#') ? ref.split('#').pop()! : ref
}
</script>

<template>
  <div>
    <p class="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-mute">
      Evidence
    </p>

    <ul v-if="evidence.length" class="space-y-1.5">
      <li v-for="(item, index) in evidence" :key="index">
        <component
          :is="target(item, slug) ? 'RouterLink' : 'div'"
          v-bind="target(item, slug) ? { to: target(item, slug) } : {}"
          class="flex items-start gap-2.5 rounded-[var(--pm-radius-sm)] px-2.5 py-2 text-[13px] transition-colors"
          :class="target(item, slug) ? 'hover:bg-surface-2' : ''"
        >
          <i :class="EVIDENCE_ICON[item.type]" class="mt-0.5 size-3.5 shrink-0 text-accent" />
          <span class="min-w-0 flex-1 text-dim">{{ item.content }}</span>
          <span v-if="item.source_ref" class="shrink-0 font-mono text-[11px] text-mute">
            {{ shortRef(item) }}
          </span>
        </component>
      </li>
    </ul>

    <p v-else class="text-xs text-mute">
      No evidence was cited. Treat the conclusion above with caution.
    </p>
  </div>
</template>
