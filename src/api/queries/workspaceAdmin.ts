import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, toValue, type MaybeRefOrGetter } from 'vue'

import { api } from '@/api/client'
import type { ActivityItem, AiProvider, Envelope } from '@/types/api'

/* ── AI providers & spend ────────────────────────────────────────────── */

export interface AiUsage {
  range_days: number
  month_to_date_usd: number
  monthly_budget_usd: number
  /** null when the budget is zero — a ratio would be a division by zero. */
  budget_used_ratio: number | null
  projected_month_end_usd: number
  requests: number
  cost_usd: number
  tokens: number
  avg_latency_ms: number
  cache_hit_rate: number
  error_rate: number
  by_model: { provider: string, model: string, calls: number, cost_usd: number, tokens: number }[]
}

export function useAiProviders() {
  return useQuery({
    queryKey: ['ai-providers'],
    queryFn: async () => (await api.get<Envelope<AiProvider[]>>('/ai-providers')).data.data,
    staleTime: 60_000,
  })
}

export function useAiUsage(days: MaybeRefOrGetter<number> = 30) {
  return useQuery({
    queryKey: computed(() => ['ai-usage', toValue(days)]),
    queryFn: async () =>
      (await api.get<Envelope<AiUsage>>('/workspace/usage', { params: { days: toValue(days) } })).data.data,
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  })
}

export interface ProviderCheck {
  ok: boolean
  provider: string
  model: string
  message: string
  models: string[]
  latency_ms: number
}

/** Tests credentials before anything is saved, exactly as the wizard does. */
export function useTestProvider() {
  return useMutation({
    mutationFn: async (payload: { provider: string, api_key?: string, model?: string, base_url?: string }) =>
      (await api.post<Envelope<ProviderCheck>>('/ai-providers/test', payload)).data.data,
  })
}

export function useSaveProvider() {
  const client = useQueryClient()

  return useMutation({
    mutationFn: async ({ uuid, ...body }: Record<string, unknown> & { uuid?: string }) =>
      uuid
        ? (await api.put(`/ai-providers/${uuid}`, body)).data
        : (await api.post('/ai-providers', body)).data,
    onSuccess: () => client.invalidateQueries({ queryKey: ['ai-providers'] }),
  })
}

export function useDeleteProvider() {
  const client = useQueryClient()

  return useMutation({
    mutationFn: async (uuid: string) => (await api.delete(`/ai-providers/${uuid}`)).data,
    onSuccess: () => client.invalidateQueries({ queryKey: ['ai-providers'] }),
  })
}

/* ── members ─────────────────────────────────────────────────────────── */

export interface Member {
  uuid: string
  name: string
  email: string
  initials: string
  avatar_url: string | null
  job_title: string | null
  role: string
  joined_at: string | null
  is_owner: boolean
  is_you: boolean
}

export interface Invitation {
  uuid: string
  email: string
  role: string
  expires_at: string | null
  expired: boolean
  invited_at: string | null
  accept_url?: string
}

export function useMembers() {
  return useQuery({
    queryKey: ['members'],
    queryFn: async () => (await api.get<Envelope<Member[]>>('/members')).data.data,
    staleTime: 60_000,
  })
}

export function useInvitations() {
  return useQuery({
    queryKey: ['invitations'],
    queryFn: async () => (await api.get<Envelope<Invitation[]>>('/invitations')).data.data,
    staleTime: 30_000,
  })
}

export function useMemberActions() {
  const client = useQueryClient()
  const refresh = () => {
    client.invalidateQueries({ queryKey: ['members'] })
    client.invalidateQueries({ queryKey: ['invitations'] })
  }

  return {
    changeRole: useMutation({
      mutationFn: async ({ uuid, role }: { uuid: string, role: string }) =>
        (await api.put(`/members/${uuid}`, { role })).data,
      onSuccess: refresh,
    }),
    remove: useMutation({
      mutationFn: async (uuid: string) => (await api.delete(`/members/${uuid}`)).data,
      onSuccess: refresh,
    }),
    invite: useMutation({
      mutationFn: async (payload: { email: string, role: string }) =>
        (await api.post<Envelope<Invitation>>('/invitations', payload)).data.data,
      onSuccess: refresh,
    }),
    revoke: useMutation({
      mutationFn: async (uuid: string) => (await api.delete(`/invitations/${uuid}`)).data,
      onSuccess: refresh,
    }),
  }
}

/* ── workspace settings ──────────────────────────────────────────────── */

export interface WorkspaceSettings {
  uuid: string
  name: string
  slug: string
  logo_url: string | null
  plan: string
  privacy_mode: 'cloud_redacted' | 'local_only'
  monthly_ai_budget_usd: number
  timezone: string
  webhook_base_url: string | null
  created_at: string | null
  contents: { projects: number, integrations: number, failures: number, members: number }
}

export function useWorkspaceSettings() {
  return useQuery({
    queryKey: ['workspace-settings'],
    queryFn: async () =>
      (await api.get<Envelope<WorkspaceSettings>>('/workspace/settings')).data.data,
    staleTime: 60_000,
  })
}

export function useUpdateWorkspace() {
  const client = useQueryClient()

  return useMutation({
    mutationFn: async (body: Record<string, unknown>) =>
      (await api.put<Envelope<WorkspaceSettings>>('/workspace/settings', body)).data.data,
    onSuccess: () => client.invalidateQueries({ queryKey: ['workspace-settings'] }),
  })
}

/* ── activity feed ───────────────────────────────────────────────────── */

export interface ActivityFilters {
  project?: string
  level?: string
  action?: string
}

interface ActivityPage {
  data: ActivityItem[]
  meta: { next_cursor: string | null, has_more: boolean }
  filters: { actions: string[] }
}

export function useActivityFeed(
  filters: MaybeRefOrGetter<ActivityFilters>,
  cursor: MaybeRefOrGetter<string | null>,
) {
  return useQuery({
    queryKey: computed(() => ['activity-feed', toValue(filters), toValue(cursor)]),
    queryFn: async () => {
      const params = Object.fromEntries(
        Object.entries(toValue(filters)).filter(([, v]) => v !== undefined && v !== ''),
      )

      const encoded = toValue(cursor)

      return (await api.get<ActivityPage>('/workspace/activity', {
        params: { ...params, limit: 25, ...(encoded ? { cursor: encoded } : {}) },
      })).data
    },
    staleTime: 15_000,
    placeholderData: keepPreviousData,
  })
}
