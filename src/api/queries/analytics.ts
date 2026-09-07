import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, toValue, type MaybeRefOrGetter } from 'vue'

import { api } from '@/api/client'
import type { AnomalyItem, Envelope, ProjectAnalytics } from '@/types/api'

export function useAnalytics(slug: MaybeRefOrGetter<string>, days: MaybeRefOrGetter<number>) {
  return useQuery({
    queryKey: computed(() => ['analytics', toValue(slug), toValue(days)]),
    queryFn: async () =>
      (await api.get<Envelope<ProjectAnalytics>>(`/projects/${toValue(slug)}/analytics`, {
        params: { days: toValue(days) },
      })).data.data,
    staleTime: 60_000,
    // Keeps the panels visible while a range change refetches, rather than
    // collapsing the page and reflowing it under the cursor.
    placeholderData: keepPreviousData,
  })
}

export function useAnomalies(slug: MaybeRefOrGetter<string>, status: MaybeRefOrGetter<string> = '') {
  return useQuery({
    queryKey: computed(() => ['anomalies', toValue(slug), toValue(status)]),
    queryFn: async () =>
      (await api.get<Envelope<AnomalyItem[]>>(`/projects/${toValue(slug)}/anomalies`, {
        params: toValue(status) ? { status: toValue(status) } : {},
      })).data.data,
    staleTime: 30_000,
  })
}

/**
 * Acknowledge, resolve, or push back.
 *
 * "Not an issue" records a false positive rather than hiding the row — it is
 * what feeds threshold tuning, and a detector nobody can disagree with gets
 * ignored within a week, taking the real alerts with it.
 */
export function useAnomalyAction(slug: MaybeRefOrGetter<string>) {
  const client = useQueryClient()

  return useMutation({
    mutationFn: async (
      { uuid, action }: { uuid: string, action: 'acknowledge' | 'resolve' | 'false-positive' },
    ) => (await api.put(`/anomalies/${uuid}/${action}`)).data,
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['anomalies', toValue(slug)] })
    },
  })
}
