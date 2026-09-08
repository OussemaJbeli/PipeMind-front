<script setup lang="ts">
import type { ApiError } from '@/api/client'
import { usePolicies, useSavePolicy, type PolicyRow } from '@/api/queries/remediation'

const { data: policies, isPending, isError, error, refetch } = usePolicies()
const save = useSavePolicy()

// A local copy per row: editing the query cache directly would make an
// unsaved change look saved, and a refetch would silently discard it.
const drafts = ref<Record<string, PolicyRow>>({})
const editing = ref<string | null>(null)
const saveError = ref<string | null>(null)
const notice = ref<string | null>(null)

function edit(policy: PolicyRow) {
  editing.value = policy.action_type
  saveError.value = null
  notice.value = null
  drafts.value[policy.action_type] = {
    ...policy,
    allowed_branches: [...policy.allowed_branches],
    blocked_branches: [...policy.blocked_branches],
  }
}

function draft(actionType: string) {
  return drafts.value[actionType]
}

function commit(actionType: string) {
  const row = drafts.value[actionType]

  if (!row)
    return

  saveError.value = null

  save.mutate(row, {
    onSuccess: (result) => {
      editing.value = null
      notice.value = result.cancelled_remediations > 0
        // Stated out loud: tightening a policy cancels work it would no longer
        // permit, and somebody was waiting on that approval.
        ? `Saved. ${result.cancelled_remediations} pending remediation(s) were cancelled because this action is no longer permitted.`
        : 'Saved.'
    },
    onError: thrown => (saveError.value = (thrown as unknown as ApiError).message),
  })
}

const MODES = [
  { key: 'auto', label: 'Automatic' },
  { key: 'approval', label: 'Needs approval' },
  { key: 'forbidden', label: 'Never' },
] as const

const RISKS = [
  { key: 'low', label: 'Low' },
  { key: 'medium', label: 'Medium' },
  { key: 'high', label: 'High' },
  { key: 'critical', label: 'Critical' },
] as const

function modeLabel(mode: string) {
  return MODES.find(m => m.key === mode)?.label ?? mode
}

function toList(value: string) {
  return value.split(',').map(part => part.trim()).filter(Boolean)
}
</script>

<template>
  <div class="mx-auto max-w-[880px]">
    <h1 class="text-xl font-semibold">Remediation policies</h1>
    <p class="mt-1 max-w-[64ch] text-sm text-dim">
      What PipeMind may do without asking. An action with no policy is refused,
      so nothing here fails open — and the risk of each action is fixed by what
      it does, never by what the model claims about it.
    </p>

    <PmAsyncBoundary
      class="mt-5"
      :loading="isPending"
      :error="isError ? (error as unknown as ApiError) : null"
      @retry="refetch"
    >
      <template #default>
        <PmAlert v-if="notice" tone="info" class="mb-4">{{ notice }}</PmAlert>
        <PmAlert v-if="saveError" tone="danger" class="mb-4">{{ saveError }}</PmAlert>

        <div class="space-y-3">
          <PmCard v-for="policy in policies" :key="policy.action_type">
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div class="min-w-0">
                <div class="flex flex-wrap items-center gap-2">
                  <h2 class="text-[15px] font-medium">{{ policy.label }}</h2>
                  <RiskBadge :risk="policy.intrinsic_risk" />

                  <!--
                    Distinct from "forbidden": the policy could permit it and
                    PipeMind still has no way to carry it out. Saying so stops
                    someone configuring an action that will never run.
                  -->
                  <PmBadge v-if="!policy.executable" tone="dim">
                    Not executable by PipeMind
                  </PmBadge>
                </div>

                <p class="mt-1 text-xs text-dim">
                  <template v-if="!policy.enabled || policy.mode === 'forbidden'">
                    Never runs.
                  </template>
                  <template v-else>
                    {{ modeLabel(policy.mode) }} · up to {{ policy.max_risk }} risk ·
                    from {{ Math.round(policy.min_confidence * 100) }}% confidence ·
                    max {{ policy.max_per_day }}/day
                  </template>
                </p>

                <p v-if="policy.enabled && policy.mode !== 'forbidden'" class="mt-1 text-[11px] text-mute">
                  Branches {{ policy.allowed_branches.join(', ') || 'none' }}
                  <template v-if="policy.blocked_branches.length">
                    · always asks on {{ policy.blocked_branches.join(', ') }}
                  </template>
                </p>
              </div>

              <PmButton
                v-if="editing !== policy.action_type"
                variant="ghost"
                size="sm"
                @click="edit(policy)"
              >
                <i-lucide-pencil class="size-3.5" />Edit
              </PmButton>
            </div>

            <div
              v-if="editing === policy.action_type && draft(policy.action_type)"
              class="mt-4 space-y-4 border-t pt-4"
            >
              <PmSegmented
                v-model="draft(policy.action_type)!.mode"
                :options="MODES.map(m => ({ key: m.key, label: m.label }))"
              />

              <template v-if="draft(policy.action_type)!.mode !== 'forbidden'">
                <PmSelect
                  v-model="draft(policy.action_type)!.max_risk"
                  label="Run automatically up to"
                  :options="RISKS.map(r => ({ key: r.key, label: r.label }))"
                />
                <p class="-mt-2 text-xs text-mute">
                  Anything above this still runs, but asks first. The default
                  branch counts as one level higher than usual.
                </p>

                <AuthField
                  :model-value="String(Math.round(draft(policy.action_type)!.min_confidence * 100))"
                  label="Minimum confidence (%)"
                  type="number"
                  @update:model-value="v => draft(policy.action_type)!.min_confidence = Number(v) / 100"
                />

                <AuthField
                  :model-value="String(draft(policy.action_type)!.max_per_day)"
                  label="Maximum per day"
                  type="number"
                  hint="A remediation loop that retries forever is worse than no remediation."
                  @update:model-value="v => draft(policy.action_type)!.max_per_day = Number(v)"
                />

                <AuthField
                  :model-value="draft(policy.action_type)!.allowed_branches.join(', ')"
                  label="Allowed branches"
                  :required="false"
                  hint="Comma separated. * matches everything."
                  @update:model-value="v => draft(policy.action_type)!.allowed_branches = toList(v)"
                />

                <AuthField
                  :model-value="draft(policy.action_type)!.blocked_branches.join(', ')"
                  label="Always ask on"
                  :required="false"
                  hint="These never run automatically, whatever the other limits say."
                  @update:model-value="v => draft(policy.action_type)!.blocked_branches = toList(v)"
                />
              </template>

              <PmToggle
                v-model="draft(policy.action_type)!.enabled"
                label="Policy enabled"
                description="Disabled means the action is refused, the same as having no policy at all."
              />

              <div class="flex items-center gap-3">
                <PmButton
                  variant="primary"
                  size="sm"
                  :loading="save.isPending.value"
                  @click="commit(policy.action_type)"
                >
                  Save policy
                </PmButton>
                <PmButton variant="ghost" size="sm" @click="editing = null">Cancel</PmButton>
              </div>
            </div>
          </PmCard>
        </div>
      </template>
    </PmAsyncBoundary>
  </div>
</template>
