import { keepPreviousData, useQuery } from '@tanstack/vue-query'
import { computed, ref, toValue, type MaybeRefOrGetter } from 'vue'

import { api } from '@/api/client'
import { whenNotLive } from '@/api/polling'
import type {
  AnalysisListItem,
  AnalysisTotals,
  Envelope,
  Paginated,
  PipelineDetail,
  PipelineListItem,
  SignatureItem,
} from '@/types/api'

export interface PipelineFilters {
  status?: string
  ref?: string
  source?: string
  range?: string
  page?: number
}

interface PipelinePage extends Paginated<PipelineListItem> {
  filters: { refs: string[] }
}

export function usePipelines(
  slug: MaybeRefOrGetter<string>,
  filters: MaybeRefOrGetter<PipelineFilters>,
) {
  const anyRunning = ref(false)

  const query = useQuery({
    queryKey: computed(() => ['pipelines', toValue(slug), toValue(filters)]),
    queryFn: async () => {
      const params = Object.fromEntries(
        Object.entries(toValue(filters)).filter(([, v]) => v !== undefined && v !== ''),
      )

      const { data } = await api.get<PipelinePage>(
        `/projects/${toValue(slug)}/pipelines`,
        { params: { ...params, per_page: 25 } },
      )

      anyRunning.value = data.data.some(p => p.status === 'running' || p.status === 'queued')

      return data
    },
    staleTime: 15_000,
    // Poll only while something is in flight. An unconditional interval on a
    // 25-row table is a load generator with no benefit.
    refetchInterval: whenNotLive(() => (anyRunning.value ? 8_000 : false)),
    refetchIntervalInBackground: false,
    placeholderData: keepPreviousData,
  })

  return { ...query, anyRunning }
}

export function usePipeline(slug: MaybeRefOrGetter<string>, iid: MaybeRefOrGetter<number | string>) {
  const active = ref(false)

  const query = useQuery({
    queryKey: computed(() => ['pipeline', toValue(slug), toValue(iid)]),
    queryFn: async () => {
      const { data } = await api.get<Envelope<PipelineDetail>>(
        `/projects/${toValue(slug)}/pipelines/${toValue(iid)}`,
      )

      active.value = data.data.status === 'running' || data.data.status === 'queued'

      return data.data
    },
    staleTime: 10_000,
    refetchInterval: whenNotLive(() => (active.value ? 5_000 : false)),
    refetchIntervalInBackground: false,
  })

  return { ...query, active }
}

interface AnalysesPage extends Paginated<AnalysisListItem> {
  totals: AnalysisTotals
}

export function useAnalyses(slug: MaybeRefOrGetter<string>, page: MaybeRefOrGetter<number> = 1) {
  return useQuery({
    queryKey: computed(() => ['analyses', toValue(slug), toValue(page)]),
    queryFn: async () =>
      (await api.get<AnalysesPage>(`/projects/${toValue(slug)}/analyses`, {
        params: { page: toValue(page), per_page: 25 },
      })).data,
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  })
}

export function useSignatures(
  slug: MaybeRefOrGetter<string>,
  options: MaybeRefOrGetter<{ category?: string, known?: boolean, page?: number }> = {},
) {
  return useQuery({
    queryKey: computed(() => ['signatures', toValue(slug), toValue(options)]),
    queryFn: async () => {
      const params = Object.fromEntries(
        Object.entries(toValue(options)).filter(([, v]) => v !== undefined && v !== '' && v !== false),
      )

      return (await api.get<Paginated<SignatureItem>>(`/projects/${toValue(slug)}/signatures`, {
        params: { ...params, per_page: 50 },
      })).data
    },
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  })
}
