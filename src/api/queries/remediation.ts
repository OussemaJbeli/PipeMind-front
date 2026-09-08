import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, ref, toValue, type MaybeRefOrGetter } from 'vue'

import { api } from '@/api/client'
import { whenNotLive } from '@/api/polling'
import type { Envelope } from '@/types/api'
import type { ActionType, Severity } from '@/types/domain'

export type RemediationStatus =
  | 'pending_approval' | 'approved' | 'rejected' | 'queued'
  | 'executing' | 'succeeded' | 'failed' | 'cancelled' | 'expired'

export type PolicyDecision = 'auto_allowed' | 'requires_approval' | 'forbidden'

export interface Remediation {
  uuid: string
  action_type: ActionType
  action_label: string
  risk: Severity
  status: RemediationStatus
  policy_decision: PolicyDecision | null
  /** Names the limit that was hit. Shown above the approve button. */
  policy_reason: string | null
  result: { summary?: string, url?: string, dry_run?: boolean } | null
  error: string | null
  rejection_reason: string | null
  requested_by: string | null
  approved_by: string | null
  rejected_by: string | null
  expires_at: string | null
  executed_at: string | null
  completed_at: string | null
  created_at: string | null
  /** null means "not verified yet", which is not the same as "did not fix". */
  outcome_success: boolean | null
  resulting_pipeline: { iid: number, status: string, web_url: string | null } | null
  recommendation: {
    uuid: string
    title: string
    description: string | null
    confidence: number | null
    affected_files: string[]
    patch: string | null
  } | null
  failure: {
    uuid: string
    category: string | null
    error_message: string | null
    pipeline_iid: number | null
    ref: string | null
  } | null
}

export interface RemediationDetail extends Remediation {
  audit: { event: string, user_id: number | null, at: string, meta: Record<string, unknown> }[]
}

export function useRemediations(slug: MaybeRefOrGetter<string>) {
  // Tracked in a ref rather than read off the query inside the interval — the
  // same shape usePipelines uses, and it keeps the interval callback free of
  // vue-query's generics so `whenNotLive` can wrap it.
  const anyInFlight = ref(false)

  return useQuery({
    queryKey: computed(() => ['remediations', toValue(slug)]),
    queryFn: async () => {
      const { data } = await api.get<Envelope<Remediation[]> & { meta: { pending: number } }>(
        `/projects/${toValue(slug)}/remediations`,
      )

      anyInFlight.value = data.data.some(
        r => r.status === 'approved' || r.status === 'queued' || r.status === 'executing',
      )

      return { items: data.data, pending: data.meta.pending }
    },
    staleTime: 15_000,
    // Execution happens on the queue, so a just-approved remediation moves
    // through executing → succeeded without the user doing anything. Polling
    // stops once nothing is in flight.
    refetchInterval: whenNotLive(() => (anyInFlight.value ? 4_000 : false)),
    refetchIntervalInBackground: false,
  })
}

/** The audit trail, fetched only when a row is opened. */
export function useRemediation(uuid: MaybeRefOrGetter<string | null>) {
  return useQuery({
    queryKey: computed(() => ['remediation', toValue(uuid)]),
    queryFn: async () =>
      (await api.get<Envelope<RemediationDetail>>(`/remediations/${toValue(uuid)}`)).data.data,
    enabled: computed(() => Boolean(toValue(uuid))),
  })
}

export interface DryRun {
  possible: boolean
  summary: string
  dry_run?: boolean
  meta?: Record<string, unknown>
}

/**
 * What would happen, without doing it.
 *
 * Worth its own request rather than being folded into the approval payload: the
 * first thing anyone sensibly asks of a tool that edits their repository is to
 * watch it do nothing.
 */
export function useDryRun(uuid: MaybeRefOrGetter<string | null>) {
  return useQuery({
    queryKey: computed(() => ['remediation-dry-run', toValue(uuid)]),
    queryFn: async () =>
      (await api.get<Envelope<DryRun>>(`/remediations/${toValue(uuid)}/dry-run`)).data.data,
    enabled: computed(() => Boolean(toValue(uuid))),
    retry: false,
  })
}

/** Turns a recommendation into a remediation. May 403 when policy forbids it. */
export function useAcceptRecommendation() {
  const client = useQueryClient()

  return useMutation({
    mutationFn: async (recommendationUuid: string) =>
      (await api.post<Envelope<Remediation>>(
        `/recommendations/${recommendationUuid}/accept`,
      )).data.data,
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['remediations'] })
      client.invalidateQueries({ queryKey: ['failure'] })
    },
  })
}

export function useApproveRemediation(slug: MaybeRefOrGetter<string>) {
  const client = useQueryClient()

  return useMutation({
    mutationFn: async (uuid: string) =>
      (await api.post<Envelope<Remediation>>(`/remediations/${uuid}/approve`)).data.data,
    onSuccess: () => client.invalidateQueries({ queryKey: ['remediations', toValue(slug)] }),
  })
}

export function useRejectRemediation(slug: MaybeRefOrGetter<string>) {
  const client = useQueryClient()

  return useMutation({
    mutationFn: async ({ uuid, reason }: { uuid: string, reason: string }) =>
      (await api.post<Envelope<Remediation>>(`/remediations/${uuid}/reject`, { reason })).data.data,
    onSuccess: () => client.invalidateQueries({ queryKey: ['remediations', toValue(slug)] }),
  })
}

/* ── policies ────────────────────────────────────────────────────────── */

export interface PolicyRow {
  action_type: ActionType
  label: string
  /** From the action type, never from the model. */
  intrinsic_risk: Severity
  configured: boolean
  mode: 'auto' | 'approval' | 'forbidden'
  max_risk: Severity
  min_confidence: number
  max_per_day: number
  allowed_branches: string[]
  blocked_branches: string[]
  enabled: boolean
  /** false means PipeMind cannot perform it even if the policy allowed it. */
  executable: boolean
}

export function usePolicies() {
  return useQuery({
    queryKey: ['remediation-policies'],
    queryFn: async () => (await api.get<Envelope<PolicyRow[]>>('/workspace/policies')).data.data,
    staleTime: 60_000,
  })
}

export function useSavePolicy() {
  const client = useQueryClient()

  return useMutation({
    mutationFn: async ({ action_type, ...body }: PolicyRow) =>
      (await api.put<Envelope<{ cancelled_remediations: number }>>(
        `/workspace/policies/${action_type}`,
        {
          mode: body.mode,
          max_risk: body.max_risk,
          min_confidence: body.min_confidence,
          max_per_day: body.max_per_day,
          allowed_branches: body.allowed_branches,
          blocked_branches: body.blocked_branches,
          enabled: body.enabled,
        },
      )).data.data,
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['remediation-policies'] })
      // Tightening a policy cancels work it would no longer permit, so the
      // remediation lists are stale the moment this returns.
      client.invalidateQueries({ queryKey: ['remediations'] })
    },
  })
}
