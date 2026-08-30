import { describe, expect, it } from 'vitest'

import { CATEGORY_META } from '@/composables/useCategoryMeta'
import { FAILURE_CATEGORIES } from '@/types/domain'

const API = process.env.PIPEMIND_API ?? 'http://localhost:8000/api/v1'

describe('category metadata', () => {
  it('covers every category in the domain type', () => {
    for (const category of FAILURE_CATEGORIES)
      expect(CATEGORY_META[category], `missing meta for ${category}`).toBeDefined()

    expect(Object.keys(CATEGORY_META)).toHaveLength(FAILURE_CATEGORIES.length)
  })

  it('uses distinct colours so slices are distinguishable', () => {
    const colors = Object.values(CATEGORY_META).map(m => m.color)
    expect(new Set(colors).size).toBe(colors.length)
  })

  /**
   * Guards the drift that makes the donut and the bar list disagree.
   * Skipped when the backend is not running so the suite stays runnable offline.
   */
  it('matches the backend enum', async () => {
    let payload: { data: Array<{ value: string, color: string, label: string }> }

    try {
      const response = await fetch(`${API}/meta/categories`)
      if (!response.ok)
        return
      payload = await response.json()
    }
    catch {
      return
    }

    for (const remote of payload.data) {
      const local = CATEGORY_META[remote.value as keyof typeof CATEGORY_META]
      expect(local, `frontend is missing ${remote.value}`).toBeDefined()
      expect(local.color, `colour drift on ${remote.value}`).toBe(remote.color)
      expect(local.label, `label drift on ${remote.value}`).toBe(remote.label)
    }
  })
})
