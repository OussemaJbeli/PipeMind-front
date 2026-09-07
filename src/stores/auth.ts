import { defineStore } from 'pinia'

import { api, csrf, setTeamHeader } from '@/api/client'
import type { AuthUser, Envelope, TeamSummary } from '@/types/api'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as AuthUser | null,
    /** False until the first /auth/me completes — the router waits on this. */
    ready: false,
  }),

  getters: {
    isAuthenticated: state => state.user !== null,
    currentTeam: (state): TeamSummary | null => state.user?.current_team ?? null,
    role: state => state.user?.current_team?.role ?? null,
    permissions: (state): string[] => state.user?.permissions ?? [],
    needsOnboarding: state => state.user !== null && !state.user.onboarded_at,
    initials: state => state.user?.initials ?? '',
  },

  actions: {
    /**
     * The single authorisation check in the UI. Derived server-side from the role
     * matrix — never re-derive it from `role`.
     */
    can(permission: string): boolean {
      return this.permissions.includes(permission)
    },

    async fetchUser() {
      try {
        const { data } = await api.get<Envelope<AuthUser>>('/auth/me')
        this.user = data.data
        setTeamHeader(this.user.current_team?.uuid ?? null)
      }
      catch {
        this.user = null
        setTeamHeader(null)
      }
      finally {
        this.ready = true
      }
    },

    async login(email: string, password: string, remember = false) {
      await csrf()
      await api.post('/auth/login', { email, password, remember })
      await this.fetchUser()
    },

    async register(payload: {
      name: string
      email: string
      password: string
      password_confirmation: string
      team_name?: string
    }) {
      await csrf()
      await api.post('/auth/register', payload)
      await this.fetchUser()
    },

    async forgotPassword(email: string) {
      await csrf()
      await api.post('/auth/forgot-password', { email })
    },

    async resetPassword(payload: {
      token: string
      email: string
      password: string
      password_confirmation: string
    }) {
      await csrf()
      await api.post('/auth/reset-password', payload)
    },

    /** Joins the team and switches to it, so the caller lands somewhere useful. */
    async acceptInvitation(token: string) {
      await csrf()
      await api.post(`/invitations/${token}/accept`)
      await this.fetchUser()
    },

    /** Stops the router guard redirecting to /welcome. */
    async completeOnboarding() {
      const { data } = await api.post<{ data: AuthUser }>('/auth/onboarded')
      this.user = data.data
    },

    async logout() {
      try {
        await api.post('/auth/logout')
      }
      finally {
        this.clear()
      }
    },

    async switchTeam(uuid: string) {
      await api.post(`/teams/${uuid}/switch`)
      // Every cached response is team-scoped and therefore now wrong.
      window.location.reload()
    },

    clear() {
      this.user = null
      setTeamHeader(null)
    },
  },
})
