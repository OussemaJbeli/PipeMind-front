<script setup lang="ts">
import type { ApiError } from '@/api/client'
import {
  useApproveRemediation,
  useRejectRemediation,
  useRemediations,
  type Remediation,
} from '@/api/queries/remediation'
import { formatDistanceToNowStrict } from 'date-fns'

import { ACTION_META } from '@/composables/useActionMeta'
import { useAuthStore } from '@/stores/auth'

const props = defineProps<{ slug: string }>()

const auth = useAuthStore()
const canApproveRole = computed(() => auth.can('remediation.approve'))

const { data, isPending, isError, error, refetch } = useRemediations(() => props.slug)
const approve = useApproveRemediation(() => props.slug)
const reject = useRejectRemediation(() => props.slug)

const pending = computed(() => (data.value?.items ?? []).filter(r => r.status === 'pending_approval'))
const recent = computed(() => (data.value?.items ?? []).filter(r => r.status !== 'pending_approval'))

const open = ref<Remediation | null>(null)
const actionError = ref<string | null>(null)

// Nobody approves their own request. The server enforces it; the dialog says so
// up front rather than letting someone click and get a 403.
function canApprove(remediation: Remediation) {
  return canApproveRole.value && remediation.requested_by !== auth.user?.name
}

function onApprove() {
  if (!open.value)
    return

  actionError.value = null

  approve.mutate(open.value.uuid, {
    onSuccess: () => (open.value = null),
    onError: thrown => (actionError.value = (thrown as unknown as ApiError).message),
  })
}

function onReject(reason: string) {
  if (!open.value)
    return

  actionError.value = null

  reject.mutate({ uuid: open.value.uuid, reason }, {
    onSuccess: () => (open.value = null),
    onError: thrown => (actionError.value = (thrown as unknown as ApiError).message),
  })
}

const STATUS_META: Record<string, { icon: string, tone: string, label: string }> = {
  succeeded: { icon: 'i-lucide-circle-check', tone: 'var(--pm-success)', label: 'Succeeded' },
  failed: { icon: 'i-lucide-circle-x', tone: 'var(--pm-danger)', label: 'Failed' },
  rejected: { icon: 'i-lucide-circle-slash', tone: 'var(--pm-text-mute)', label: 'Rejected' },
  cancelled: { icon: 'i-lucide-ban', tone: 'var(--pm-text-mute)', label: 'Cancelled' },
  expired: { icon: 'i-lucide-clock-alert', tone: 'var(--pm-warning)', label: 'Expired' },
  executing: { icon: 'i-lucide-loader-circle', tone: 'var(--pm-info)', label: 'Running' },
  approved: { icon: 'i-lucide-loader-circle', tone: 'var(--pm-info)', label: 'Queued' },
  queued: { icon: 'i-lucide-loader-circle', tone: 'var(--pm-info)', label: 'Queued' },
}

function statusOf(remediation: Remediation) {
  return STATUS_META[remediation.status]
    ?? { icon: 'i-lucide-circle', tone: 'var(--pm-text-dim)', label: remediation.status }
}

/**
 * Plain formatting rather than `useRelativeTime`: that composable installs a
 * ticking interval, and calling it per row inside a template would start a new
 * one on every render. The list refetches while anything is in flight, which is
 * what keeps these honest.
 */
function ago(iso: string | null) {
  return iso ? `${formatDistanceToNowStrict(new Date(iso))} ago` : '—'
}

function until(iso: string | null) {
  return iso ? `in ${formatDistanceToNowStrict(new Date(iso))}` : '—'
}

function actionMeta(remediation: Remediation) {
  return ACTION_META[remediation.action_type]
    ?? { label: remediation.action_label, icon: 'i-lucide-circle' }
}

/**
 * Whether it actually worked is a separate fact from whether it ran, and it
 * arrives minutes later. null must read as "not verified", never as "did not
 * fix" — the difference is the whole value of watching the outcome.
 */
function outcomeLabel(remediation: Remediation) {
  if (remediation.status !== 'succeeded')
    return null

  if (remediation.outcome_success === true)
    return { tone: 'success' as const, text: 'Verified — the pipeline passed afterwards' }

  if (remediation.outcome_success === false)
    return { tone: 'danger' as const, text: 'Did not fix it — the pipeline failed again' }

  return { tone: 'dim' as const, text: 'Not verified yet' }
}
</script>

<template>
  <div class="mx-auto max-w-[900px]">
    <h1 class="text-xl font-semibold">Remediation</h1>
    <p class="mt-1 max-w-[62ch] text-sm text-dim">
      Actions PipeMind has taken or is waiting to take. Every one passes a policy
      you control, and anything that changes your repository is proposed as a
      pull request rather than committed.
    </p>

    <PmAsyncBoundary
      class="mt-5"
      :loading="isPending"
      :error="isError ? (error as unknown as ApiError) : null"
      @retry="refetch"
    >
      <template #default>
        <PmAlert v-if="actionError" tone="danger" class="mb-4">{{ actionError }}</PmAlert>

        <!-- Pending first: it is the only section that needs somebody to act. -->
        <section v-if="pending.length">
          <h2 class="mb-2 text-[13px] font-semibold">
            Pending approval ({{ pending.length }})
          </h2>

          <div class="space-y-3">
            <PmCard v-for="remediation in pending" :key="remediation.uuid">
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <h3 class="text-[15px] font-medium">
                    {{ remediation.recommendation?.title ?? remediation.action_label }}
                  </h3>
                  <p class="mt-1 text-xs text-mute">
                    Requested by {{ remediation.requested_by ?? 'PipeMind' }}
                    · expires {{ until(remediation.expires_at) }}
                  </p>
                </div>
                <RiskBadge :risk="remediation.risk" />
              </div>

              <p v-if="remediation.failure" class="mt-2 truncate font-mono text-[11px] text-dim">
                {{ remediation.failure.category }} ·
                {{ remediation.failure.error_message }}
                <template v-if="remediation.failure.pipeline_iid">
                  · #{{ remediation.failure.pipeline_iid }}
                </template>
              </p>

              <ul
                v-if="remediation.recommendation?.affected_files.length"
                class="mt-2 flex flex-wrap gap-1.5"
              >
                <li
                  v-for="file in remediation.recommendation.affected_files"
                  :key="file"
                  class="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[11px] text-dim"
                >{{ file }}</li>
              </ul>

              <PolicyNotice
                :decision="remediation.policy_decision"
                :reason="remediation.policy_reason"
                class="mt-3"
              />

              <div class="mt-3 flex justify-end">
                <PmButton variant="primary" size="sm" @click="open = remediation">
                  Review
                </PmButton>
              </div>
            </PmCard>
          </div>
        </section>

        <PmEmptyState
          v-if="!pending.length && !recent.length"
          icon="i-lucide-wrench"
          title="Nothing to remediate"
          message="When an analysis produces an action PipeMind can take, it appears here
                   — automatically if your policy allows it, or waiting for approval if not."
        />

        <section v-if="recent.length" :class="pending.length > 0 ? 'mt-6' : ''">
          <h2 class="mb-2 text-[13px] font-semibold">Recent</h2>

          <PmCard :padded="false">
            <ul class="divide-y">
              <li
                v-for="remediation in recent"
                :key="remediation.uuid"
                class="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5 first:pt-0 last:pb-0"
              >
                <i
                  :class="[statusOf(remediation).icon, remediation.status === 'executing' && 'animate-spin']"
                  class="size-4 shrink-0"
                  :style="{ color: statusOf(remediation).tone }"
                />

                <span class="min-w-0 flex-1 truncate text-sm">
                  {{ remediation.recommendation?.title ?? remediation.action_label }}
                </span>

                <span class="text-[11px] text-mute">
                  {{ actionMeta(remediation).label }}
                  · {{ remediation.policy_decision === 'auto_allowed' ? 'auto' : 'approved' }}
                  · {{ ago(remediation.completed_at ?? remediation.created_at) }}
                </span>

                <a
                  v-if="remediation.result?.url"
                  :href="remediation.result.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-[11px] underline hover:text-fg"
                >open</a>

                <PmBadge
                  v-if="outcomeLabel(remediation)"
                  :tone="outcomeLabel(remediation)!.tone"
                >
                  {{ outcomeLabel(remediation)!.text }}
                </PmBadge>

                <!-- The provider's own words: they usually name the cause. -->
                <p
                  v-if="remediation.error"
                  class="w-full font-mono text-[11px] text-[color:var(--pm-danger)]"
                >{{ remediation.error }}</p>
                <p
                  v-else-if="remediation.rejection_reason"
                  class="w-full text-[11px] italic text-mute"
                >“{{ remediation.rejection_reason }}”</p>
              </li>
            </ul>
          </PmCard>
        </section>
      </template>
    </PmAsyncBoundary>

    <ApprovalDialog
      v-if="open"
      :remediation="open"
      :can-approve="canApprove(open)"
      :approving="approve.isPending.value"
      :rejecting="reject.isPending.value"
      @close="open = null"
      @approve="onApprove"
      @reject="onReject"
    />
  </div>
</template>
