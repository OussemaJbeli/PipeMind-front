import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, ref, toValue, type MaybeRefOrGetter } from 'vue'

import { api } from '@/api/client'
import { whenNotLive } from '@/api/polling'
import type {
  AnalysisFeedbackPayload,
  Envelope,
  FailureDetail,
  FailureListItem,
  JobLogPayload,
  Paginated,
  ResolutionType,
} from '@/types/api'

export interface FailureFilters {
  project?: string
  status?: string
  category?: string
  severity?: string
  resolved?: boolean
  range?: string
  per_page?: number
}

export function useFailures(filters: MaybeRefOrGetter<FailureFilters>) {
  return useQuery({
    queryKey: computed(() => ['failures', toValue(filters)]),
    queryFn: async () => {
      const params = Object.fromEntries(
        Object.entries(toValue(filters)).filter(([, v]) => v !== undefined && v !== ''),
      )

      return (await api.get<Paginated<FailureListItem>>('/failures', { params })).data
    },
    staleTime: 15_000,
    // Keeps the table on screen while a filter change refetches, rather than
    // blanking out and reflowing the page under the user's cursor.
    placeholderData: keepPreviousData,
  })
}

/**
 * A failure with its analysis.
 *
 * Polls only while an analysis is actually in flight. The analysis arrives
 * seconds after the page opens, and without this the user would have to guess
 * when to refresh — but polling a settled failure forever is just load.
 * Roadmap 17 replaces this with websockets.
 */
export function useFailure(uuid: MaybeRefOrGetter<string>) {
  const analysing = ref(false)

  const query = useQuery({
    queryKey: computed(() => ['failure', toValue(uuid)]),
    queryFn: async () => {
      const { data } = await api.get<Envelope<FailureDetail>>(`/failures/${toValue(uuid)}`)

      analysing.value = data.data.status === 'analyzing' || data.data.status === 'queued'

      return data.data
    },
    staleTime: 10_000,
    refetchInterval: whenNotLive(() => (analysing.value ? 3_000 : false)),
    refetchIntervalInBackground: false,
  })

  return { ...query, analysing }
}

export function useJobLog(
  jobUuid: MaybeRefOrGetter<string | undefined>,
  mode: MaybeRefOrGetter<'excerpt' | 'full'> = 'excerpt',
) {
  return useQuery({
    queryKey: computed(() => ['job-log', toValue(jobUuid), toValue(mode)]),
    queryFn: async () =>
      (await api.get<Envelope<JobLogPayload>>(`/jobs/${toValue(jobUuid)}/log`, {
        params: { mode: toValue(mode) },
      })).data.data,
    // The full log is fetched only when the user asks for it: a 48 000-line
    // object has no business loading behind a collapsed panel.
    enabled: computed(() => Boolean(toValue(jobUuid))),
    staleTime: 5 * 60_000,
  })
}

export function useAnalyseFailure() {
  const client = useQueryClient()

  return useMutation({
    mutationFn: async ({ uuid, force }: { uuid: string, force?: boolean }) =>
      (await api.post(`/failures/${uuid}/analyze`, null, { params: force ? { force: 1 } : {} })).data,
    onSuccess: (_data, { uuid }) => {
      // Refetch immediately so the "analysing…" state appears without waiting
      // for the next poll tick.
      client.invalidateQueries({ queryKey: ['failure', uuid] })
    },
  })
}

export function useResolveFailure() {
  const client = useQueryClient()

  return useMutation({
    mutationFn: async (payload: {
      uuid: string
      resolution_type: ResolutionType
      resolution_note?: string
      resolution_commit_sha?: string
    }) => {
      const { uuid, ...body } = payload

      return (await api.put(`/failures/${uuid}/resolve`, body)).data
    },
    onSuccess: (_data, { uuid }) => {
      client.invalidateQueries({ queryKey: ['failure', uuid] })
      client.invalidateQueries({ queryKey: ['failures'] })
    },
  })
}

export function useIgnoreFailure() {
  const client = useQueryClient()

  return useMutation({
    mutationFn: async (uuid: string) => (await api.put(`/failures/${uuid}/ignore`)).data,
    onSuccess: (_data, uuid) => {
      client.invalidateQueries({ queryKey: ['failure', uuid] })
      client.invalidateQueries({ queryKey: ['failures'] })
    },
  })
}

/**
 * Developer feedback on an analysis.
 *
 * The least impressive-looking call in the app and the most valuable:
 * `correct_category` is the label column of the ML classifier's training set.
 * Nothing else in PipeMind produces supervised labels.
 */
export function useSubmitFeedback(failureUuid: MaybeRefOrGetter<string>) {
  const client = useQueryClient()

  return useMutation({
    mutationFn: async (
      { analysisUuid, ...payload }: AnalysisFeedbackPayload & { analysisUuid: string },
    ) => (await api.post(`/analyses/${analysisUuid}/feedback`, payload)).data,
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['failure', toValue(failureUuid)] })
    },
  })
}
