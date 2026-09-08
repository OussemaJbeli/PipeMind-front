import { useQuery } from '@tanstack/vue-query'

import { api } from '@/api/client'
import { whenNotLive } from '@/api/polling'
import type { ActivityItem, Envelope, ProjectCard, WorkspaceSummary } from '@/types/api'

export function useWorkspaceSummary() {
  return useQuery({
    queryKey: ['workspace', 'summary'],
    queryFn: async () =>
      (await api.get<Envelope<WorkspaceSummary>>('/workspace/summary')).data.data,
    staleTime: 30_000,
    // Left polling on purpose: no broadcast event covers these figures, so
    // standing the interval down while live would freeze them for good.
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
  })
}

export function useWorkspaceProjects() {
  return useQuery({
    queryKey: ['workspace', 'projects'],
    queryFn: async () =>
      (await api.get<Envelope<ProjectCard[]>>('/workspace/projects')).data.data,
    staleTime: 30_000,
    // Left polling on purpose: no broadcast event covers these figures, so
    // standing the interval down while live would freeze them for good.
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
  })
}

export function useWorkspaceActivity(limit = 10) {
  return useQuery({
    queryKey: ['workspace', 'activity', limit],
    queryFn: async () =>
      (await api.get<Envelope<ActivityItem[]>>('/workspace/activity', { params: { limit } })).data.data,
    staleTime: 15_000,
    refetchInterval: whenNotLive(() => 30_000),
    refetchIntervalInBackground: false,
  })
}
