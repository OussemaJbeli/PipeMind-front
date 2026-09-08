import { useQueryClient } from '@tanstack/vue-query'
import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { useRouter } from 'vue-router'

import { useChannel } from '@/composables/useEcho'
import { useToasts } from '@/composables/useToasts'

/* ── event payloads, mirroring the PHP broadcastWith() ─────────────────── */

interface PipelineEvent {
  uuid: string
  iid: number
  status: string
  ref: string
  duration_seconds: number | null
  finished_at: string | null
  jobs_total: number
  jobs_failed: number
  has_failure: boolean
  project_slug: string
}

interface FailureEvent {
  uuid: string
  category: string | null
  severity: string | null
  error_message: string | null
  job_name: string | null
  pipeline_iid: number | null
  ref: string | null
  project_slug: string
}

interface AnalysisEvent {
  failure_uuid: string
  analysis_uuid?: string
  status: string
  category?: string | null
  confidence?: number | null
  summary?: string | null
}

interface AnomalyEvent {
  uuid: string
  severity: string
  title: string
  description: string | null
  project_slug: string
}

interface RemediationEvent {
  uuid: string
  status: string
  title: string
  project_slug: string
  error: string | null
}

interface StatsEvent { uuid: string, slug: string }

const TERMINAL = ['success', 'failed', 'canceled', 'skipped', 'timeout']

/**
 * Live updates for everything on a project page.
 *
 * The rule throughout: **patch the cache from the payload, invalidate only when
 * the payload cannot answer the question.** Every event carries a complete
 * object, so a refetch per job event would put the API back under exactly the
 * load realtime is meant to remove — a busy pipeline emits dozens of them.
 */
export function useProjectRealtime(projectUuid: MaybeRefOrGetter<string | undefined>) {
  const client = useQueryClient()
  const router = useRouter()
  const { push } = useToasts()

  useChannel(
    computed(() => {
      const uuid = toValue(projectUuid)

      return uuid ? `project.${uuid}` : null
    }),
    {
      'pipeline.updated': (event: PipelineEvent) => {
        client.setQueriesData({ queryKey: ['pipelines'] }, (old: unknown) =>
          patchList(old, event))

        // The overview aggregates (success rate, counters) cannot be derived
        // from one pipeline, so a settled run is the moment to refetch them —
        // and only then.
        if (TERMINAL.includes(event.status))
          client.invalidateQueries({ queryKey: ['project', event.project_slug] })
      },

      'failure.detected': (event: FailureEvent) => {
        client.invalidateQueries({ queryKey: ['failures'] })
        client.invalidateQueries({ queryKey: ['project', event.project_slug] })

        push({
          tone: 'danger',
          title: `Pipeline #${event.pipeline_iid ?? '?'} failed`,
          description: event.error_message ?? undefined,
          action: {
            label: 'Investigate',
            run: () => router.push({
              name: 'project.failure',
              params: { slug: event.project_slug, uuid: event.uuid },
            }),
          },
        })
      },

      'analysis.started': (event: AnalysisEvent) => {
        // Flips the panel to "analysing…" without a request. The wait is only a
        // few seconds, but it is exactly when someone is watching the page.
        client.setQueryData(['failure', event.failure_uuid], (old: unknown) =>
          old && typeof old === 'object'
            ? { ...(old as object), status: 'analyzing' }
            : old)
      },

      'analysis.completed': (event: AnalysisEvent) => {
        // The summary is enough for a list row; the failure page needs the
        // evidence and recommendations, which are far too large for a frame.
        client.setQueryData(['failure', event.failure_uuid], (old: unknown) =>
          old && typeof old === 'object'
            ? { ...(old as object), status: 'analyzed' }
            : old)

        client.invalidateQueries({ queryKey: ['failure', event.failure_uuid] })
        client.invalidateQueries({ queryKey: ['failures'] })
      },

      'anomaly.detected': (event: AnomalyEvent) => {
        client.invalidateQueries({ queryKey: ['anomalies'] })

        push({
          tone: event.severity === 'critical' ? 'danger' : 'warning',
          title: event.title,
          description: event.description ?? undefined,
        })
      },

      'remediation.status': (event: RemediationEvent) => {
        client.invalidateQueries({ queryKey: ['remediations'] })

        if (event.status === 'succeeded') {
          push({ tone: 'success', title: 'Remediation applied', description: event.title })
        }
        else if (event.status === 'failed') {
          push({ tone: 'danger', title: `Remediation failed: ${event.title}`,
            description: event.error ?? undefined })
        }
      },

      'stats.updated': (event: StatsEvent) => {
        client.invalidateQueries({ queryKey: ['project', event.slug] })
      },
    },
  )
}

/**
 * Replaces one pipeline inside a paginated list, in place.
 *
 * Returns the original object untouched when the pipeline is not on the page
 * the user is looking at — writing a new array reference would re-render the
 * table for an event that changed nothing visible.
 */
function patchList(old: unknown, event: PipelineEvent): unknown {
  if (!old || typeof old !== 'object' || !('data' in old))
    return old

  const page = old as { data: Array<{ uuid: string }> }

  if (!Array.isArray(page.data) || !page.data.some(row => row.uuid === event.uuid))
    return old

  return {
    ...page,
    data: page.data.map(row => (row.uuid === event.uuid ? { ...row, ...event } : row)),
  }
}
