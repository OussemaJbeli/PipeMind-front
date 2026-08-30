import axios, { type AxiosError } from 'axios'
import NProgress from 'nprogress'

import type { ApiErrorCode } from '@/types/domain'

export interface ApiError {
  message: string
  errorCode: ApiErrorCode | null
  retryable: boolean
  status: number
  /** Present on 422 only. */
  validation: Record<string, string[]> | null
}

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api/v1',
  withCredentials: true,
  headers: {
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
})

/* Progress bar: only show it once, however many requests are in flight. */
let inFlight = 0

function start() {
  if (++inFlight === 1)
    NProgress.start()
}

function done() {
  if (--inFlight <= 0) {
    inFlight = 0
    NProgress.done()
  }
}

/* Set by the auth store at boot; avoids a circular import between the two. */
let teamUuid: string | null = null
let onUnauthenticated: (() => void) | null = null

export function setTeamHeader(uuid: string | null) {
  teamUuid = uuid
}

export function setUnauthenticatedHandler(fn: () => void) {
  onUnauthenticated = fn
}

api.interceptors.request.use((config) => {
  start()

  if (teamUuid)
    config.headers.set('X-Team', teamUuid)

  return config
})

api.interceptors.response.use(
  (response) => {
    done()
    return response
  },
  async (error: AxiosError<Record<string, unknown>>) => {
    done()

    const status = error.response?.status ?? 0

    if (status === 401)
      onUnauthenticated?.()

    if (status === 419) {
      // Sanctum CSRF cookie expired. Refresh it so the caller's retry succeeds.
      await axios.get('/sanctum/csrf-cookie', { withCredentials: true }).catch(() => {})
    }

    return Promise.reject(normalize(error))
  },
)

function normalize(error: AxiosError<Record<string, any>>): ApiError {
  const status = error.response?.status ?? 0
  const body = error.response?.data ?? {}

  return {
    message: (body.message as string)
      ?? (status === 0
        ? 'Cannot reach the server.'
        : 'Something went wrong.'),
    errorCode: (body.error_code as ApiErrorCode) ?? null,
    // Network failures and 5xx are worth retrying; a 4xx generally is not.
    retryable: (body.retryable as boolean) ?? (status === 0 || status >= 500),
    status,
    validation: status === 422 ? (body.errors as Record<string, string[]>) ?? null : null,
  }
}

/** Sanctum requires the CSRF cookie before the first stateful POST. */
export async function csrf() {
  await axios.get('/sanctum/csrf-cookie', { withCredentials: true })
}
