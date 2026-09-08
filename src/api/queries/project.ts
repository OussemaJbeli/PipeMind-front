import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, toValue, type MaybeRefOrGetter } from 'vue'

import { api } from '@/api/client'
import { whenNotLive } from '@/api/polling'
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
    refetchInterval: whenNotLive(() => (hasRunning.value ? 8_000 : 60_000)),
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

/* ── settings & integration ──────────────────────────────────────────── */

export interface ProjectSettings {
  uuid: string
  name: string
  slug: string
  description: string | null
  color: string | null
  icon: string | null
  tech_stack: string[]
  default_branch: string
  repository_url: string | null
  web_url: string | null
  is_active: boolean
  auto_analyze: boolean
  /** `['*']` means every branch — the server normalises an empty list to it. */
  analyze_on_branches: string[]
  ai_provider: { uuid: string, name: string, model: string | null } | null
  /**
   * null when the project has no integration at all. That project receives no
   * events and looks perfectly healthy, so the view has to say so explicitly.
   */
  integration: {
    uuid: string
    name: string
    provider: string
    status: string
    base_url: string | null
    last_event_at: string | null
    last_error: string | null
    external_path: string | null
    external_id: string | null
  } | null
  stats: { pipelines: number, failures: number, last_pipeline_at: string | null }
}

export function useProjectSettings(slug: MaybeRefOrGetter<string>) {
  return useQuery({
    queryKey: computed(() => ['project-settings', toValue(slug)]),
    queryFn: async () =>
      (await api.get<Envelope<ProjectSettings>>(`/projects/${toValue(slug)}/settings`)).data.data,
    staleTime: 30_000,
  })
}

export interface ProjectUpdate {
  name?: string
  description?: string | null
  tech_stack?: string[]
  default_branch?: string
  is_active?: boolean
  auto_analyze?: boolean
  analyze_on_branches?: string[]
  ai_provider_uuid?: string | null
}

export function useUpdateProject(slug: MaybeRefOrGetter<string>) {
  const client = useQueryClient()

  return useMutation({
    mutationFn: async (body: ProjectUpdate) =>
      (await api.put<Envelope<ProjectSettings>>(`/projects/${toValue(slug)}`, body)).data.data,
    onSuccess: (updated) => {
      // The sidebar, the header and the project list all render the name, so a
      // rename that only updated this screen would look like it failed.
      client.setQueryData(['project-settings', toValue(slug)], updated)
      client.invalidateQueries({ queryKey: ['project', toValue(slug)] })
      client.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}
