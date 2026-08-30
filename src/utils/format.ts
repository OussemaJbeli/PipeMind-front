/** Small, but they appear on every screen — get them right once. */

export function duration(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined)
    return '—'

  if (seconds < 60)
    return `${Math.round(seconds)}s`

  const minutes = Math.floor(seconds / 60)
  const remainder = Math.round(seconds % 60)

  if (minutes < 60)
    return remainder ? `${minutes}m ${remainder}s` : `${minutes}m`

  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`
}

export function percent(value: number | null | undefined, digits = 1): string {
  return value === null || value === undefined ? '—' : `${value.toFixed(digits)}%`
}

export function compactNumber(value: number): string {
  return new Intl.NumberFormat(undefined, {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value)
}

export function bytes(value: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let n = value
  let i = 0

  while (n >= 1024 && i < units.length - 1) {
    n /= 1024
    i++
  }

  return `${n.toFixed(i ? 1 : 0)} ${units[i]}`
}

export function cost(usd: number): string {
  // Sub-cent costs are the norm. Rounding to 2dp shows "$0.00" for every
  // analysis and makes the whole cost feature look broken.
  return usd < 0.01 ? `$${usd.toFixed(4)}` : `$${usd.toFixed(2)}`
}

export type DeltaTone = 'positive' | 'negative' | 'neutral'

/**
 * Which way is good depends on the metric, not the sign. Fewer failures and a
 * lower MTTR are improvements — deriving tone from the arrow is the bug that
 * paints every improvement red.
 */
export function deltaTone(
  delta: number | null | undefined,
  positiveDirection: 'up' | 'down' = 'up',
): DeltaTone {
  if (delta === null || delta === undefined || delta === 0)
    return 'neutral'

  const isGood = positiveDirection === 'up' ? delta > 0 : delta < 0

  return isGood ? 'positive' : 'negative'
}
