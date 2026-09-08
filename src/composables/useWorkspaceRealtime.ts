import { useQueryClient } from '@tanstack/vue-query'
import { computed, watch } from 'vue'

import { useChannel, useConnectionStatus } from '@/composables/useEcho'
import { useAuthStore } from '@/stores/auth'

interface ActivityEvent {
  uuid: string
  action: string
  level: string
  title: string
  description: string | null
}

interface RemediationEvent {
  uuid: string
  status: string
  title: string
  project_slug: string
}

/**
 * Workspace-wide live updates, plus reconnect resynchronisation.
 *
 * Mounted once at the workspace layout. The team channel carries the things
 * that are not tied to a project the user happens to be looking at — the
 * activity feed, and the pending-approval count that has to be visible from
 * anywhere.
 */
export function useWorkspaceRealtime() {
  const auth = useAuthStore()
  const client = useQueryClient()
  const { state } = useConnectionStatus()

  useChannel(
    computed(() => {
      const uuid = auth.currentTeam?.uuid

      return uuid ? `team.${uuid}` : null
    }),
    {
      'activity.created': (_event: ActivityEvent) => {
        client.invalidateQueries({ queryKey: ['workspace', 'activity'] })
        client.invalidateQueries({ queryKey: ['activity'] })
      },

      'remediation.status': (_event: RemediationEvent) => {
        // Drives the sidebar badge. The project view has its own handler; this
        // one exists so the count is right while you are somewhere else.
        client.invalidateQueries({ queryKey: ['remediations'] })
      },
    },
  )

  /**
   * Events that happened while the socket was down are gone — Reverb has no
   * replay. Rather than reason about what was missed, refetch everything once
   * on reconnect: it is a single burst, and it is the only way the screen is
   * provably correct again.
   */
  watch(state, (now, before) => {
    if (now === 'connected' && before && before !== 'connected')
      client.invalidateQueries()
  })
}
