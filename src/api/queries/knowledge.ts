import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, toValue, type MaybeRefOrGetter } from 'vue'

import { api } from '@/api/client'
import type { Envelope } from '@/types/api'

export type KnowledgeType = 'runbook' | 'documentation' | 'postmortem' | 'convention' | 'note'

export interface KnowledgeDocument {
  uuid: string
  type: KnowledgeType
  title: string
  source_url: string | null
  token_count: number
  version: number
  is_active: boolean
  /** null project_id server-side: retrievable by every project in the team. */
  team_wide: boolean
  chunks_count: number
  /**
   * null while the index job is queued, running, or has failed. An unindexed
   * document reaches no analysis, so the UI must never present it as active
   * knowledge.
   */
  indexed_at: string | null
  created_by: string | null
  created_at: string
  excerpt: string
}

export interface KnowledgeDocumentFull extends KnowledgeDocument {
  content: string
}

export interface KnowledgeInput {
  type: KnowledgeType
  title: string
  content: string
  source_url?: string | null
  team_wide?: boolean
}

export const KNOWLEDGE_TYPES: ReadonlyArray<{ key: KnowledgeType, label: string, hint: string }> = [
  { key: 'runbook', label: 'Runbook', hint: 'A symptom, its cause, and the fix. The most useful kind.' },
  { key: 'documentation', label: 'Documentation', hint: 'How a service or pipeline is meant to work.' },
  { key: 'postmortem', label: 'Post-mortem', hint: 'What broke, why, and what changed afterwards.' },
  { key: 'convention', label: 'Convention', hint: 'A rule the team follows that a model cannot infer.' },
  { key: 'note', label: 'Note', hint: 'Anything else worth remembering.' },
]

export function useKnowledge(slug: MaybeRefOrGetter<string>) {
  return useQuery({
    queryKey: computed(() => ['knowledge', toValue(slug)]),
    queryFn: async () =>
      (await api.get<Envelope<KnowledgeDocument[]>>(`/projects/${toValue(slug)}/knowledge`)).data.data,
    staleTime: 30_000,
    // Indexing happens on the queue, so a freshly saved document arrives
    // unindexed and becomes retrievable a few seconds later. Polling is how
    // that transition shows up without the user reloading; it stops as soon as
    // nothing is pending.
    //
    // Deliberately NOT wrapped in whenNotLive(): no broadcast event reports
    // indexing, so standing this down while connected would leave a document
    // showing "indexing…" until the page is reloaded.
    refetchInterval: query =>
      (query.state.data ?? []).some(d => !d.indexed_at) ? 4_000 : false,
    refetchIntervalInBackground: false,
  })
}

/** Full content, fetched only when the editor opens — the list omits it. */
export function useKnowledgeDocument(uuid: MaybeRefOrGetter<string | null>) {
  return useQuery({
    queryKey: computed(() => ['knowledge-document', toValue(uuid)]),
    queryFn: async () =>
      (await api.get<Envelope<KnowledgeDocumentFull>>(`/knowledge/${toValue(uuid)}`)).data.data,
    enabled: computed(() => Boolean(toValue(uuid))),
    staleTime: 0,
  })
}

export function useSaveKnowledge(slug: MaybeRefOrGetter<string>) {
  const client = useQueryClient()

  return useMutation({
    mutationFn: async ({ uuid, ...body }: KnowledgeInput & { uuid?: string }) =>
      uuid
        ? (await api.put<Envelope<KnowledgeDocument>>(`/knowledge/${uuid}`, body)).data.data
        : (await api.post<Envelope<KnowledgeDocument>>(
            `/projects/${toValue(slug)}/knowledge`, body,
          )).data.data,
    onSuccess: (_, variables) => {
      client.invalidateQueries({ queryKey: ['knowledge', toValue(slug)] })

      if (variables.uuid)
        client.invalidateQueries({ queryKey: ['knowledge-document', variables.uuid] })
    },
  })
}

export function useDeleteKnowledge(slug: MaybeRefOrGetter<string>) {
  const client = useQueryClient()

  return useMutation({
    mutationFn: async (uuid: string) => { await api.delete(`/knowledge/${uuid}`) },
    onSuccess: () => client.invalidateQueries({ queryKey: ['knowledge', toValue(slug)] }),
  })
}

/**
 * Re-chunks and re-embeds. Needed after a chunk-size or embedding-model change,
 * because existing chunks keep the boundaries they were written with.
 */
export function useReindexKnowledge(slug: MaybeRefOrGetter<string>) {
  const client = useQueryClient()

  return useMutation({
    mutationFn: async (uuid: string) =>
      (await api.post<Envelope<KnowledgeDocument>>(`/knowledge/${uuid}/reindex`)).data.data,
    onSuccess: () => client.invalidateQueries({ queryKey: ['knowledge', toValue(slug)] }),
  })
}
