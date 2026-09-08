import { realtimeIsLive } from '@/composables/useEcho'

/**
 * Stands a polling interval down while WebSockets are delivering.
 *
 * Wrapping every interval in one place is what makes the fallback honest: the
 * rule "poll unless live" is stated once, so a screen cannot end up silently
 * relying on realtime alone. When the socket drops, `realtimeIsLive()` goes
 * false and the interval each query already had resumes — no reconnection
 * bookkeeping at the call sites.
 *
 * Note this is evaluated by vue-query on every tick, not captured once.
 */
export function whenNotLive<A extends unknown[]>(
  interval: (...args: A) => number | false,
): (...args: A) => number | false {
  return (...args: A) => (realtimeIsLive() ? false : interval(...args))
}
