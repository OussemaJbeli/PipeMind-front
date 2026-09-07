import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { nextTick } from 'vue'

import LogViewer from '@/components/failure/LogViewer.vue'

/**
 * A full CI log runs to tens of thousands of lines. Rendering one row per line
 * means ~100 000 DOM nodes, and the tab stops responding long before the reader
 * finds anything — so the DOM node count must stay bounded by the viewport, not
 * by the log.
 */
describe('logViewer', () => {
  function makeLog(lines: number, errorAt = 1294) {
    return Array.from({ length: lines }, (_, i) =>
      i === errorAt ? 'SQLSTATE[HY000] [2002] Connection refused' : `npm install package-${i}`).join('\n')
  }

  // The component reaches for the full log through vue-query; retries off so a
  // missing backend fails fast instead of stalling the suite.
  function mountViewer(props: Record<string, unknown>) {
    return mount(LogViewer, {
      props,
      global: {
        plugins: [[VueQueryPlugin, {
          queryClient: new QueryClient({ defaultOptions: { queries: { retry: false } } }),
        }]],
        stubs: { PmSegmented: true, PmBadge: true, PmTooltip: true },
      },
    })
  }

  // The window is measured by ResizeObserver, which resolves asynchronously —
  // asserting before it settles reads zero rows and passes vacuously.
  async function settle() {
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 20))
    await nextTick()
  }

  it('renders only a window of a 48 000-line log', async () => {
    const wrapper = mountViewer({
      excerpt: makeLog(48_000),
      startLine: 1,
      highlight: 'SQLSTATE[HY000] [2002] Connection refused',
    })

    await settle()

    const rendered = wrapper.findAll('[data-log-line]').length

    // Bounded by viewport height plus overscan — nowhere near the 48 000 rows a
    // naive render would produce.
    expect(rendered).toBeGreaterThan(0)
    expect(rendered).toBeLessThan(200)
  })

  it('the window does not grow with the log', async () => {
    const small = mountViewer({ excerpt: makeLog(200, 5), startLine: 1, highlight: 'x' })
    const huge = mountViewer({ excerpt: makeLog(48_000), startLine: 1, highlight: 'x' })

    await settle()

    // The whole point: cost is bounded by the viewport, not by the log. A
    // 48 000-line log must render the same number of nodes as a 200-line one.
    expect(huge.findAll('[data-log-line]').length)
      .toBe(small.findAll('[data-log-line]').length)
  })

  it('marks the error line, not every line', async () => {
    const wrapper = mountViewer({
      excerpt: makeLog(200, 5),
      startLine: 1,
      highlight: 'SQLSTATE[HY000] [2002] Connection refused',
    })

    await settle()

    expect(wrapper.html()).toContain('Error on line')
  })

  it('says so when there is no log rather than rendering an empty box', () => {
    const wrapper = mountViewer({ excerpt: '', startLine: 1 })

    expect(wrapper.text()).toContain('No log is available')
  })
})
