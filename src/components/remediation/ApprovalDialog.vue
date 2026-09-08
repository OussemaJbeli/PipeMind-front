<script setup lang="ts">
import type { ApiError } from '@/api/client'
import { useDryRun, type Remediation } from '@/api/queries/remediation'
import { ACTION_META, RISK_CONSEQUENCE } from '@/composables/useActionMeta'
import { useRelativeTime } from '@/composables/useRelativeTime'

const props = defineProps<{
  remediation: Remediation
  approving?: boolean
  rejecting?: boolean
  /** False when the viewer requested it: nobody approves their own request. */
  canApprove: boolean
}>()

const emit = defineEmits<{
  close: []
  approve: []
  reject: [reason: string]
}>()

const rec = computed(() => props.remediation.recommendation)
const meta = computed(() => ACTION_META[props.remediation.action_type]
  ?? { label: props.remediation.action_label, icon: 'i-lucide-circle' })

const consequence = computed(() => RISK_CONSEQUENCE[props.remediation.risk])
const expires = useRelativeTime(() => props.remediation.expires_at)

// Fetched here rather than on the list: it costs a request per row otherwise,
// and this is the moment the answer actually matters.
const { data: dry, isPending: checking, isError: dryFailed, error: dryError }
  = useDryRun(() => props.remediation.uuid)

const showReject = ref(false)
const reason = ref('')
const rejectTooShort = computed(() => reason.value.trim().length < 3)
</script>

<template>
  <PmModal :title="rec?.title ?? remediation.action_label" size="lg" @close="emit('close')">
    <!--
      What will happen, in plain language, above the button. "Apply fix" with no
      visible consequence is how trust gets destroyed.
    -->
    <PmAlert :tone="remediation.risk === 'low' ? 'info' : 'warning'" class="mb-4">
      <span class="font-medium capitalize">{{ remediation.risk }} risk</span> — {{ consequence }}
    </PmAlert>

    <PolicyNotice
      :decision="remediation.policy_decision"
      :reason="remediation.policy_reason"
      class="mb-4"
    />

    <!--
      The dry run is the honest answer to "what exactly are you about to do".
      A failure here is information, not an error state: it usually means the
      action is no longer valid.
    -->
    <div class="mb-4 rounded-[var(--pm-radius)] border bg-surface-2 p-3">
      <p class="mb-1 text-[11px] uppercase tracking-wide text-mute">Dry run</p>
      <p v-if="checking" class="flex items-center gap-2 text-xs text-dim">
        <i-lucide-loader-circle class="size-3.5 animate-spin" />Checking what this would do…
      </p>
      <p v-else-if="dryFailed" class="text-xs text-[color:var(--pm-danger)]">
        {{ (dryError as unknown as ApiError)?.message ?? 'This action could not be checked.' }}
      </p>
      <template v-else-if="dry">
        <p class="text-xs leading-relaxed" :class="dry.possible ? 'text-fg' : 'text-[color:var(--pm-warning)]'">
          {{ dry.summary }}
        </p>
        <p v-if="!dry.possible" class="mt-1 text-[11px] text-mute">
          Approving will record the decision, but the action will be cancelled instead of run.
        </p>
      </template>
    </div>

    <dl class="grid grid-cols-[130px_minmax(0,1fr)] gap-y-2 text-sm">
      <dt class="text-dim">Action</dt>
      <dd class="flex items-center gap-1.5">
        <i :class="meta.icon" class="size-3.5 shrink-0" />{{ meta.label }}
      </dd>

      <dt class="text-dim">Branch</dt>
      <dd class="font-mono text-xs">{{ remediation.failure?.ref ?? '—' }}</dd>

      <template v-if="rec?.affected_files.length">
        <dt class="text-dim">Files</dt>
        <dd class="flex flex-wrap gap-1.5">
          <code
            v-for="file in rec.affected_files"
            :key="file"
            class="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[11px]"
          >{{ file }}</code>
        </dd>
      </template>

      <template v-if="rec?.confidence !== null && rec?.confidence !== undefined">
        <dt class="text-dim">Confidence</dt>
        <dd>{{ Math.round(rec.confidence * 100) }}%</dd>
      </template>

      <dt class="text-dim">Requested by</dt>
      <dd>{{ remediation.requested_by ?? 'PipeMind' }}</dd>

      <dt class="text-dim">Expires</dt>
      <dd>{{ expires }}</dd>
    </dl>

    <p v-if="rec?.description" class="mt-4 text-sm leading-relaxed text-dim">
      {{ rec.description }}
    </p>

    <PatchDiff v-if="rec?.patch" :patch="rec.patch" class="mt-4" />

    <!--
      Rejection needs a reason. A bare "rejected" teaches nobody anything, and
      these rejections are the record of what the policy should have caught.
    -->
    <div v-if="showReject" class="mt-4">
      <label for="reject-reason" class="mb-1.5 block text-[13px] font-medium">
        Why are you rejecting this?
      </label>
      <textarea
        id="reject-reason"
        v-model="reason"
        rows="3"
        class="w-full rounded-[var(--pm-radius)] border bg-surface-2 p-3 text-sm outline-none focus:border-[color:var(--pm-accent)]"
        placeholder="The healthcheck belongs in the base compose file, not the CI override."
      />
    </div>

    <template #footer>
      <PmButton variant="ghost" @click="emit('close')">Cancel</PmButton>

      <template v-if="showReject">
        <PmButton
          variant="danger"
          :loading="rejecting"
          :disabled="rejectTooShort"
          @click="emit('reject', reason.trim())"
        >
          Confirm rejection
        </PmButton>
      </template>
      <template v-else>
        <PmButton variant="outline" @click="showReject = true">Reject</PmButton>
        <PmTooltip
          v-if="!canApprove"
          content="You requested this, so somebody else has to approve it."
        >
          <PmButton variant="primary" disabled>Approve &amp; run</PmButton>
        </PmTooltip>
        <PmButton
          v-else
          variant="primary"
          :loading="approving"
          @click="emit('approve')"
        >
          Approve &amp; run
        </PmButton>
      </template>
    </template>
  </PmModal>
</template>
