import { formatDistanceToNowStrict } from 'date-fns'
import { useNow } from '@vueuse/core'
import { computed, toValue, type MaybeRefOrGetter } from 'vue'

/**
 * Live "2 min ago" that actually ticks. A static timestamp on a monitoring
 * dashboard is worse than none: it looks fresh when it is an hour stale.
 */
export function useRelativeTime(iso: MaybeRefOrGetter<string | null | undefined>) {
  const now = useNow({ interval: 30_000 })

  return computed(() => {
    const value = toValue(iso)

    if (!value)
      return '—'

    // Touch `now` so the computed re-evaluates on each tick.
    void now.value

    return `${formatDistanceToNowStrict(new Date(value))} ago`
  })
}
