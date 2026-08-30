import { describe, expect, it } from 'vitest'

import { bytes, cost, deltaTone, duration, percent } from '@/utils/format'

describe('duration', () => {
  it('formats seconds, minutes and hours', () => {
    expect(duration(45)).toBe('45s')
    expect(duration(134)).toBe('2m 14s')
    expect(duration(222)).toBe('3m 42s')
    expect(duration(1080)).toBe('18m')
    expect(duration(3900)).toBe('1h 5m')
  })

  it('handles null rather than rendering NaN', () => {
    expect(duration(null)).toBe('—')
    expect(duration(undefined)).toBe('—')
  })
})

describe('cost', () => {
  it('keeps sub-cent precision', () => {
    // Rounding to 2dp shows "$0.00" for every analysis and makes the whole
    // cost feature look broken.
    expect(cost(0.000412)).toBe('$0.0004')
    expect(cost(4.82)).toBe('$4.82')
  })
})

describe('deltaTone', () => {
  it('treats a decrease as positive when down is good', () => {
    // Fewer failures and a lower MTTR are improvements. Deriving tone from the
    // sign is the bug that paints every improvement red.
    expect(deltaTone(-25, 'down')).toBe('positive')
    expect(deltaTone(25, 'down')).toBe('negative')
  })

  it('treats an increase as positive when up is good', () => {
    expect(deltaTone(2.4, 'up')).toBe('positive')
    expect(deltaTone(-2.4, 'up')).toBe('negative')
  })

  it('returns neutral for no change', () => {
    expect(deltaTone(0, 'up')).toBe('neutral')
    expect(deltaTone(null, 'down')).toBe('neutral')
  })
})

describe('formatters', () => {
  it('formats percentages and bytes', () => {
    expect(percent(98.2)).toBe('98.2%')
    expect(percent(null)).toBe('—')
    expect(bytes(2481920)).toBe('2.4 MB')
    expect(bytes(512)).toBe('512 B')
  })
})
