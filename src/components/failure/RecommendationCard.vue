<script setup lang="ts">
import { ACTION_META } from '@/composables/useActionMeta'
import type { Recommendation } from '@/types/api'

const props = defineProps<{ rec: Recommendation }>()

const meta = computed(() => ACTION_META[props.rec.action_type]
  ?? { label: props.rec.action_type, icon: 'i-lucide-circle' })

/**
 * The remediation policy engine lands in roadmap 18, so `policy` is absent today.
 *
 * Rendering an Apply button without it would offer an action the backend cannot
 * honour. Until the gate exists, the card shows what to do and stops there —
 * which is honest, and still useful.
 */
const gateKnown = computed(() => Boolean(props.rec.policy))
</script>

<template>
  <div class="rounded-[var(--pm-radius)] border p-4">
    <div class="flex items-start justify-between gap-2">
      <h4 class="text-[13px] font-semibold leading-snug">
        {{ rec.title }}
      </h4>
      <RiskBadge :risk="rec.risk" />
    </div>

    <p v-if="rec.description" class="mt-2 text-xs leading-relaxed text-dim">
      {{ rec.description }}
    </p>

    <p v-if="rec.rationale" class="mt-2 border-l-2 pl-2.5 text-xs italic text-mute">
      {{ rec.rationale }}
    </p>

    <ul v-if="rec.affected_files.length" class="mt-2.5 space-y-1">
      <li
        v-for="file in rec.affected_files"
        :key="file"
        class="flex items-center gap-1.5 font-mono text-[11px] text-dim"
      >
        <i-lucide-file class="size-3 shrink-0" />{{ file }}
      </li>
    </ul>

    <!-- The diff IS the recommendation when there is one; it goes above the
         metadata rather than behind a "review" button. -->
    <PatchDiff v-if="rec.patch" :patch="rec.patch" class="mt-3" />

    <div class="mt-3 flex flex-wrap items-center gap-2 border-t pt-3 text-[11px] text-mute">
      <span class="flex items-center gap-1">
        <i :class="meta.icon" class="size-3" />{{ meta.label }}
      </span>
      <span v-if="rec.confidence !== null">{{ Math.round(rec.confidence * 100) }}% confident</span>
    </div>

    <!-- Automated application arrives with the policy engine in roadmap 18. -->
    <p v-if="!gateKnown" class="mt-2 text-[11px] text-mute">
      Apply this manually — PipeMind does not yet execute changes.
    </p>
  </div>
</template>
