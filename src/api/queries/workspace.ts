import { useQuery } from '@tanstack/vue-query'

import { api } from '@/api/client'
import type { ActivityItem, Envelope, ProjectCard, WorkspaceSummary } from '@/types/api'

export function useWorkspaceSummary() {
  return useQuery({
    queryKey: ['workspace', 'summary'],
    queryFn: async () =>
      (await api.get<Envelope<WorkspaceSummary>>('/workspace/summary')).data.data,
    staleTime: 30_000,
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
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
  })
}
