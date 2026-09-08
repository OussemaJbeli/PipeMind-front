<script setup lang="ts">
import type { ApiError } from '@/api/client'
import { useAcceptRecommendation } from '@/api/queries/remediation'
import { ACTION_META } from '@/composables/useActionMeta'
import { useAuthStore } from '@/stores/auth'
import type { Recommendation } from '@/types/api'

const props = defineProps<{ rec: Recommendation, slug?: string }>()

const auth = useAuthStore()
const accept = useAcceptRecommendation()

const meta = computed(() => ACTION_META[props.rec.action_type]
  ?? { label: props.rec.action_type, icon: 'i-lucide-circle' })

/**
 * A recommendation persisted before the policy engine existed carries no gate.
 * Absent is not permission: offering Apply would promise an action the backend
 * would refuse, so the card says to apply it by hand instead.
 */
const gateKnown = computed(() => Boolean(props.rec.policy))
const decision = computed(() => props.rec.policy?.decision ?? null)

const canRequest = computed(() =>
  auth.can('remediation.request') && decision.value !== 'forbidden')

const result = ref<string | null>(null)
const actionError = ref<string | null>(null)

function apply() {
  result.value = null
  actionError.value = null

  accept.mutate(props.rec.uuid, {
    onSuccess: (remediation) => {
      result.value = remediation.status === 'pending_approval'
        ? 'Sent for approval.'
        : 'Queued to run now.'
    },
    onError: thrown => (actionError.value = (thrown as unknown as ApiError).message),
  })
}
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

    <!--
      The gate, then the button. Showing what the policy decided before offering
      the action is the difference between an assistant and a surprise.
    -->
    <PolicyNotice
      v-if="gateKnown"
      :decision="decision"
      :reason="rec.policy?.reason ?? null"
      class="mt-3"
    />

    <p v-else class="mt-2 text-[11px] text-mute">
      Apply this manually — this recommendation predates the policy engine.
    </p>

    <div v-if="gateKnown && canRequest && !result" class="mt-3 flex justify-end">
      <PmButton variant="primary" size="sm" :loading="accept.isPending.value" @click="apply">
        {{ decision === 'auto_allowed' ? 'Apply now' : 'Request approval' }}
      </PmButton>
    </div>

    <p v-if="result" class="mt-3 flex items-center gap-1.5 text-[11px] text-accent">
      <i-lucide-check class="size-3.5" />{{ result }}
      <RouterLink
        v-if="slug"
        :to="{ name: 'project.remediation', params: { slug } }"
        class="underline hover:text-fg"
      >
        View
      </RouterLink>
    </p>

    <PmAlert v-if="actionError" tone="danger" class="mt-3">{{ actionError }}</PmAlert>
  </div>
</template>
