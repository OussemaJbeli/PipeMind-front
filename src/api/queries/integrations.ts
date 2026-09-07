import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, toValue, type MaybeRefOrGetter } from 'vue'

import { api } from '@/api/client'
import type {
  ConnectionIdentity, Envelope, ImportResult, Integration,
  RemoteRepository, WebhookSettings,
} from '@/types/api'
import type { ProviderType } from '@/types/domain'

export interface ConnectionForm {
  provider: ProviderType
  base_url?: string | null
  token: string
  username?: string
}

export function useIntegrations() {
  return useQuery({
    queryKey: ['integrations'],
    queryFn: async () => (await api.get<Envelope<Integration[]>>('/integrations')).data.data,
    staleTime: 30_000,
  })
}

export function useWebhookSettings() {
  return useQuery({
    queryKey: ['integrations', 'webhook-settings'],
    queryFn: async () =>
      (await api.get<Envelope<WebhookSettings>>('/integrations/webhook-settings')).data.data,
    staleTime: 60_000,
  })
}

/** Tests credentials that have not been saved. Nothing is persisted. */
export function useTestConnection() {
  return useMutation({
    mutationFn: async (form: ConnectionForm) =>
      (await api.post<Envelope<ConnectionIdentity>>('/integrations/test', form)).data.data,
  })
}

export function useCreateIntegration() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (form: ConnectionForm & { name: string }) =>
      (await api.post<Envelope<Integration>>('/integrations', form)).data.data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['integrations'] }),
  })
}

export function useRemoteRepositories(uuid: MaybeRefOrGetter<string | null>, search: MaybeRefOrGetter<string>) {
  return useQuery({
    queryKey: computed(() => ['integrations', toValue(uuid), 'remote', toValue(search)]),
    queryFn: async () => (await api.get<Envelope<RemoteRepository[]>>(
      `/integrations/${toValue(uuid)}/remote-projects`,
      { params: { search: toValue(search) || undefined } },
    )).data.data,
    enabled: computed(() => Boolean(toValue(uuid))),
    staleTime: 60_000,
  })
}

export function useImportRepositories(uuid: MaybeRefOrGetter<string | null>) {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (externalIds: string[]) => {
      const { data } = await api.post<{ data: ImportResult[], meta: { imported: number, webhooks_failed: number } }>(
        `/integrations/${toValue(uuid)}/import`,
        { external_ids: externalIds },
      )
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['integrations'] })
      qc.invalidateQueries({ queryKey: ['workspace'] })
    },
  })
}

/** Routine, not an edge case: a free tunnel rotates its hostname on restart. */
export function useReRegisterWebhooks(uuid: MaybeRefOrGetter<string>) {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (webhookBaseUrl?: string) => {
      const { data } = await api.post<{
        data: Array<{ project: string, ok: boolean, error: string | null }>
        meta: { webhook_url: string, total: number, failed: number }
      }>(`/integrations/${toValue(uuid)}/re-register`,
        webhookBaseUrl ? { webhook_base_url: webhookBaseUrl } : {})
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['integrations'] }),
  })
}

export function useTestIntegration(uuid: MaybeRefOrGetter<string>) {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async () =>
      (await api.post(`/integrations/${toValue(uuid)}/test`)).data.data,
    onSettled: () => qc.invalidateQueries({ queryKey: ['integrations'] }),
  })
}

export function useDeleteIntegration() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (uuid: string) => api.delete(`/integrations/${uuid}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['integrations'] })
      qc.invalidateQueries({ queryKey: ['workspace'] })
    },
  })
}
