import { keepPreviousData, useQuery } from '@tanstack/vue-query'
import { computed, toValue, type MaybeRefOrGetter } from 'vue'

import { api } from '@/api/client'
import type { Envelope, ProjectDetail, ProjectOverview } from '@/types/api'
import type { RangeKey } from '@/types/domain'

export function useProjectOverview(
  slug: MaybeRefOrGetter<string>,
  range: MaybeRefOrGetter<RangeKey>,
) {
  const hasRunning = ref(false)

  const query = useQuery({
    queryKey: computed(() => ['project', toValue(slug), 'overview', toValue(range)]),
    queryFn: async () => {
      const { data } = await api.get<Envelope<ProjectOverview>>(
        `/projects/${toValue(slug)}/overview`,
        { params: { range: toValue(range) } },
      )

      hasRunning.value = data.data.recent_pipelines
        .some(p => p.status === 'running' || p.status === 'queued')

      return data.data
    },
    staleTime: 20_000,
    // Poll fast while a pipeline is in flight, slowly otherwise, never when the
    // tab is hidden. An unconditional interval turns a dashboard into a load generator.
    refetchInterval: () => (hasRunning.value ? 8_000 : 60_000),
    refetchIntervalInBackground: false,
    // Keeps the board visible while a range change refetches, instead of blanking out.
    placeholderData: keepPreviousData,
  })

  return { ...query, hasRunning }
}

export function useProject(slug: MaybeRefOrGetter<string>) {
  return useQuery({
    queryKey: computed(() => ['project', toValue(slug)]),
    queryFn: async () =>
      (await api.get<Envelope<ProjectDetail>>(`/projects/${toValue(slug)}`)).data.data,
    staleTime: 5 * 60_000,
  })
}
