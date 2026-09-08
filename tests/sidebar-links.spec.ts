import { describe, expect, it } from 'vitest'

// The real router, not a rebuilt copy: a copy would pass while the app's own
// route table stayed broken.
import router from '@/router/index'

/**
 * The sidebar addresses routes by name, so a name that does not exist fails at
 * click time rather than at build time — which is exactly how Knowledge,
 * Integration and Project Settings shipped as dead links: each pointed at
 * `project.overview` with a `pending` flag, so clicking them silently reloaded
 * the page the user was already on.
 *
 * Vue Router resolves an unknown name by throwing, so resolution is the
 * assertion.
 */
describe('project sidebar destinations', () => {
  const NAMED = [
    'project.overview',
    'project.pipelines',
    'project.failures',
    'project.analytics',
    'project.analyses',
    'project.history',
    'project.remediation',
    'project.knowledge',
    'project.integration',
    'project.settings',
  ]

  it.each(NAMED)('resolves %s to its own path', (name) => {
    const resolved = router.resolve({ name, params: { slug: 'demo' } })

    expect(resolved.name).toBe(name)
    expect(resolved.matched.length).toBeGreaterThan(0)
  })

  it('gives every sidebar destination a distinct path', () => {
    // Two entries resolving to one path is the shape of the original bug: the
    // link works, and lands somewhere the user did not ask for.
    const paths = NAMED.map(name => router.resolve({ name, params: { slug: 'demo' } }).path)

    expect(new Set(paths).size).toBe(paths.length)
  })

  it('passes the slug through as a prop so views can fetch', () => {
    for (const name of ['project.remediation', 'project.knowledge', 'project.integration', 'project.settings']) {
      const record = router.resolve({ name, params: { slug: 'demo' } }).matched.at(-1)

      // Without props:true the view receives slug === undefined and every
      // request 404s against `/projects/undefined/...`.
      expect(record?.props?.default, `${name} must declare props`).toBeTruthy()
    }
  })
})
