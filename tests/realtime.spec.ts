import { beforeEach, describe, expect, it, vi } from 'vitest'

import { whenNotLive } from '@/api/polling'
import { useToasts } from '@/composables/useToasts'

/**
 * Realtime is an optimisation, never the only path. Every screen has to remain
 * correct with WebSockets switched off entirely — that is what makes the
 * polling fallback trustworthy.
 */
describe('polling fallback', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('polls at the given interval while not live', async () => {
    const { realtimeIsLive } = await import('@/composables/useEcho')

    expect(realtimeIsLive()).toBe(false)
    expect(whenNotLive(() => 8000)()).toBe(8000)
  })

  it('passes the callback arguments through', () => {
    const interval = whenNotLive((busy: boolean) => (busy ? 4000 : false))

    expect(interval(true)).toBe(4000)
    expect(interval(false)).toBe(false)
  })

  it('re-evaluates on every tick rather than capturing once', () => {
    let busy = false
    const interval = whenNotLive(() => (busy ? 3000 : false))

    expect(interval()).toBe(false)
    busy = true
    // vue-query calls this repeatedly; a captured value would freeze the poll
    // in whichever state it was created.
    expect(interval()).toBe(3000)
  })
})

describe('echo without configuration', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('reports not-live and returns no instance when unconfigured', async () => {
    vi.stubEnv('VITE_REVERB_KEY', '')
    vi.stubEnv('VITE_WS_HOST', '')

    const { useEcho, useConnectionStatus, realtimeIsLive } = await import('@/composables/useEcho')

    // A deployment without Reverb is a supported configuration, not a fault:
    // it must not throw, and polling must stay on.
    expect(useEcho()).toBeNull()
    expect(realtimeIsLive()).toBe(false)
    expect(useConnectionStatus().isSupported).toBe(false)

    vi.unstubAllEnvs()
  })

  it('subscribing without a connection is a no-op rather than a crash', async () => {
    vi.stubEnv('VITE_REVERB_KEY', '')
    vi.stubEnv('VITE_WS_HOST', '')

    const { useChannel } = await import('@/composables/useEcho')
    const { effectScope } = await import('vue')

    const scope = effectScope()

    // Layouts call this unconditionally. If it threw when Reverb is absent, the
    // whole page would fail to mount rather than falling back to polling.
    expect(() => scope.run(() => {
      useChannel(() => 'project.abc', { 'pipeline.updated': () => {} })
    })).not.toThrow()

    scope.stop()
    vi.unstubAllEnvs()
  })
})

describe('toasts', () => {
  beforeEach(() => {
    const { toasts, dismiss } = useToasts()
    toasts.value.forEach(t => dismiss(t.id))
  })

  it('pins a failure until it is dismissed', () => {
    const { push, toasts } = useToasts()

    push({ tone: 'danger', title: 'Pipeline #12 failed' })

    // A failure carries an action. A notification that vanishes before it is
    // read is worse than none.
    expect(toasts.value.at(-1)?.timeout).toBeNull()
  })

  it('auto-dismisses an informational toast', () => {
    const { push, toasts } = useToasts()

    push({ tone: 'success', title: 'Remediation applied' })

    expect(toasts.value.at(-1)?.timeout).toBe(6000)
  })

  it('keeps the stack short enough to read', () => {
    const { push, toasts } = useToasts()

    for (let i = 0; i < 9; i++)
      push({ tone: 'info', title: `Event ${i}`, timeout: null })

    // Beyond a handful the stack is a wall nobody reads, and the oldest are
    // the least relevant.
    expect(toasts.value.length).toBe(4)
    expect(toasts.value.at(-1)?.title).toBe('Event 8')
  })

  it('runs the action and dismisses when invoked', () => {
    const { push, toasts, dismiss } = useToasts()
    const run = vi.fn()

    const id = push({ tone: 'danger', title: 'Failed', action: { label: 'Investigate', run } })

    toasts.value.find(t => t.id === id)?.action?.run()
    dismiss(id)

    expect(run).toHaveBeenCalledOnce()
    expect(toasts.value.find(t => t.id === id)).toBeUndefined()
  })
})
