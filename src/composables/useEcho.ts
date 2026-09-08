import Echo from 'laravel-echo'
import Pusher from 'pusher-js'
import {
  computed,
  onScopeDispose,
  ref,
  toValue,
  watchEffect,
  type MaybeRefOrGetter,
  type Ref,
} from 'vue'

type Handlers = Record<string, (payload: never) => void>

/**
 * Realtime is an OPTIMISATION, never the only path.
 *
 * Every screen has to remain correct with WebSockets switched off entirely —
 * that is what makes the polling fallback trustworthy, and what let the whole
 * frontend ship before Reverb existed. So nothing here throws: a missing
 * config, a blocked port or a dead server all degrade to "not live", and the
 * queries resume polling.
 */

let echo: Echo<'reverb'> | null = null
let unavailable = false

const connectionState = ref<'connecting' | 'connected' | 'disconnected'>('connecting')

function configured(): boolean {
  return Boolean(import.meta.env.VITE_REVERB_KEY && import.meta.env.VITE_WS_HOST)
}

export function useEcho(): Echo<'reverb'> | null {
  if (echo || unavailable)
    return echo

  if (!configured()) {
    // A deployment without Reverb is a supported configuration, not a fault.
    unavailable = true
    connectionState.value = 'disconnected'

    return null
  }

  try {
    // Echo's Pusher connector expects the constructor on the window.
    ;(window as unknown as { Pusher: typeof Pusher }).Pusher = Pusher

    echo = new Echo({
      broadcaster: 'reverb',
      key: import.meta.env.VITE_REVERB_KEY,
      wsHost: import.meta.env.VITE_WS_HOST,
      wsPort: Number(import.meta.env.VITE_WS_PORT),
      wssPort: Number(import.meta.env.VITE_WS_PORT),
      forceTLS: import.meta.env.VITE_WS_SCHEME === 'https',
      enabledTransports: ['ws', 'wss'],
      // Cookie auth against the same Sanctum session the SPA already holds.
      // Bearer-token clients cannot subscribe, which is correct: only a browser
      // needs live updates.
      authEndpoint: `${import.meta.env.VITE_API_URL?.replace(/\/api\/v1\/?$/, '') ?? ''}/broadcasting/auth`,
      withCredentials: true,
    })

    bindConnectionEvents(echo)
  }
  catch {
    unavailable = true
    connectionState.value = 'disconnected'
    echo = null
  }

  return echo
}

function bindConnectionEvents(instance: Echo<'reverb'>) {
  const pusher = (instance.connector as unknown as { pusher?: {
    connection: { bind: (event: string, cb: () => void) => void }
  } }).pusher

  if (!pusher)
    return

  pusher.connection.bind('connected', () => (connectionState.value = 'connected'))
  pusher.connection.bind('connecting', () => (connectionState.value = 'connecting'))
  pusher.connection.bind('unavailable', () => (connectionState.value = 'disconnected'))
  pusher.connection.bind('failed', () => (connectionState.value = 'disconnected'))
  pusher.connection.bind('disconnected', () => (connectionState.value = 'disconnected'))
}

/**
 * Subscribes for the lifetime of the calling scope, and always leaves.
 *
 * A channel left subscribed after navigation keeps delivering events into a
 * component that no longer exists, and the server keeps authorising a socket
 * nobody is reading.
 */
export function useChannel(
  name: MaybeRefOrGetter<string | null>,
  handlers: Handlers,
): void {
  let current: string | null = null

  const leave = () => {
    if (current) {
      useEcho()?.leave(current)
      current = null
    }
  }

  watchEffect(() => {
    const next = toValue(name)

    if (next === current)
      return

    leave()

    if (!next)
      return

    const instance = useEcho()

    if (!instance)
      return

    const channel = instance.private(next)

    // The leading dot tells Echo the name is already fully qualified — these
    // are `broadcastAs()` names, not class names.
    for (const [event, handler] of Object.entries(handlers))
      channel.listen(`.${event}`, handler)

    current = next
  })

  onScopeDispose(leave)
}

/**
 * Connection state for the UI, and the flag every polling interval reads.
 *
 * `isLive` is deliberately false until `connected` actually fires: assuming
 * success would disable polling on a page that is receiving nothing.
 */
export function useConnectionStatus(): {
  state: Ref<'connecting' | 'connected' | 'disconnected'>
  isLive: Readonly<Ref<boolean>>
  isSupported: boolean
} {
  // Kick the connection off on first use so the indicator reflects reality.
  useEcho()

  return {
    state: connectionState,
    isLive: computed(() => connectionState.value === 'connected'),
    isSupported: configured(),
  }
}

/**
 * Read by every polling interval. A plain function rather than a ref so query
 * modules can use it without importing Vue reactivity into their closures.
 */
export function realtimeIsLive(): boolean {
  return connectionState.value === 'connected'
}

/** Test seam: forces a fresh instance. Not used by application code. */
export function _resetEcho(): void {
  echo?.disconnect()
  echo = null
  unavailable = false
  connectionState.value = 'connecting'
}
