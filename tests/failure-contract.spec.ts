// @vitest-environment node
//
// Node, not jsdom: jsdom enforces CORS on fetch, so a request to the local API
// from an about:blank document is blocked and this file silently skipped —
// which looks exactly like "the backend isn't running".

import { describe, expect, it } from 'vitest'

import type { FailureDetail } from '@/types/api'

/**
 * The failure page's contract, checked against the live API.
 *
 * The frontend types are hand-written; the backend resource is hand-written.
 * Nothing forces them to agree, and a drift shows up as `undefined` rendering as
 * a blank panel — which looks like missing data, not a bug.
 *
 * Skipped automatically when the API is not running, so the suite stays useful
 * offline.
 */
// Deliberately NOT VITE_API_URL: that is "/api/v1", a relative path for the
// browser's dev proxy. Node's fetch cannot resolve a relative URL, so using it
// here threw and skipped the whole file — indistinguishable from "the API is
// not running", which is the failure mode this test exists to catch.
const BASE = process.env.PM_API_URL ?? 'http://localhost:8000/api/v1'

async function token(): Promise<string | null> {
  try {
    const response = await fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        email: 'jbelioussema33@gmail.com',
        password: '123456789az',
        device_name: 'vitest',
      }),
      signal: AbortSignal.timeout(3000),
    })

    if (!response.ok)
      return null

    return (await response.json()).data.token
  }
  catch {
    return null
  }
}

const auth = await token()

describe.skipIf(!auth)('failure detail contract', () => {
  async function fetchDetail(): Promise<FailureDetail | null> {
    const list = await fetch(`${BASE}/failures?per_page=50`, {
      headers: { Authorization: `Bearer ${auth}`, Accept: 'application/json' },
    }).then(r => r.json())

    const analysed = list.data.find((f: { status: string }) => f.status === 'analyzed')

    if (!analysed)
      return null

    const detail = await fetch(`${BASE}/failures/${analysed.uuid}`, {
      headers: { Authorization: `Bearer ${auth}`, Accept: 'application/json' },
    }).then(r => r.json())

    return detail.data
  }

  it('separates observed facts from the analysis', async () => {
    const failure = await fetchDetail()
    if (!failure)
      return

    // The split the whole trust model rests on. If these ever merge, the UI can
    // no longer honestly distinguish a fact from an inference.
    expect(failure.observed).toBeDefined()
    expect(failure.observed).not.toHaveProperty('root_cause')
    expect(failure.observed).not.toHaveProperty('confidence')
    expect(failure.analysis).toHaveProperty('root_cause')
    expect(failure.analysis).toHaveProperty('confidence')
  })

  it('supplies every field the page renders', async () => {
    const failure = await fetchDetail()
    if (!failure)
      return

    for (const key of ['uuid', 'status', 'severity', 'category', 'category_label', 'observed', 'analysis', 'similar_failures', 'recommendations'])
      expect(failure, `missing ${key}`).toHaveProperty(key)

    for (const key of ['changed_files', 'previous_pipeline', 'log_excerpt'])
      expect(failure.observed, `observed.${key} missing`).toHaveProperty(key)
  })

  it('carries the provenance the analysis panel shows', async () => {
    const failure = await fetchDetail()
    if (!failure?.analysis)
      return

    for (const key of ['classification_source', 'used_rag', 'model_name', 'latency_ms', 'cost_usd', 'cache_hit', 'evidence', 'feedback'])
      expect(failure.analysis, `analysis.${key} missing`).toHaveProperty(key)
  })

  it('cites a source for every evidence item', async () => {
    const failure = await fetchDetail()
    if (!failure?.analysis)
      return

    // An unverifiable claim is not evidence. The panel renders a source ref for
    // each item, and a null one would render as a bare assertion.
    for (const item of failure.analysis.evidence)
      expect(item.source_ref, `evidence "${item.content}" has no source`).toBeTruthy()
  })
})


describe.skipIf(!auth)('project list contracts', () => {
  async function get(path: string) {
    return fetch(`${BASE}${path}`, {
      headers: { Authorization: `Bearer ${auth}`, Accept: 'application/json' },
    }).then(r => r.json())
  }

  async function firstSlug(): Promise<string | null> {
    const projects = await get('/projects')

    return projects.data?.[0]?.slug ?? null
  }

  it('pipelines carry the failure link that makes the list worth visiting', async () => {
    const slug = await firstSlug()
    if (!slug)
      return

    const body = await get(`/projects/${slug}/pipelines?per_page=5`)

    expect(body).toHaveProperty('meta.total')
    // Populates the branch filter without a second request.
    expect(body).toHaveProperty('filters.refs')

    for (const row of body.data) {
      for (const key of ['uuid', 'iid', 'status', 'ref', 'has_failure', 'failure_uuid'])
        expect(row, `pipeline.${key} missing`).toHaveProperty(key)
    }
  })

  it('analyses carry the cost and quality totals the page leads with', async () => {
    const slug = await firstSlug()
    if (!slug)
      return

    const body = await get(`/projects/${slug}/analyses?per_page=5`)

    for (const key of ['analyses', 'cost_usd', 'avg_latency_ms', 'avg_confidence', 'cache_hit_rate'])
      expect(body.totals, `totals.${key} missing`).toHaveProperty(key)

    for (const row of body.data) {
      // Three states: helpful, unhelpful, and nobody has judged it. The training
      // set depends on telling the third apart from the second.
      expect(row).toHaveProperty('was_helpful')
      expect(row).toHaveProperty('failure_uuid')
      expect(row).toHaveProperty('cost_usd')
    }
  })

  it('signatures are grouped with an occurrence count, not listed per failure', async () => {
    const slug = await firstSlug()
    if (!slug)
      return

    const body = await get(`/projects/${slug}/signatures?per_page=5`)

    for (const row of body.data) {
      for (const key of ['hash', 'occurrences', 'resolved_count', 'is_known', 'first_seen_at', 'last_seen_at'])
        expect(row, `signature.${key} missing`).toHaveProperty(key)

      expect(row.occurrences).toBeGreaterThan(0)
      expect(row.resolved_count).toBeLessThanOrEqual(row.occurrences)
    }
  })

  it('a pipeline detail supplies stages, jobs, changes and failures', async () => {
    const slug = await firstSlug()
    if (!slug)
      return

    const list = await get(`/projects/${slug}/pipelines?per_page=1`)
    const iid = list.data?.[0]?.iid
    if (!iid)
      return

    const body = await get(`/projects/${slug}/pipelines/${iid}`)

    for (const key of ['stages', 'jobs', 'changes', 'failures', 'project'])
      expect(body.data, `pipeline.${key} missing`).toHaveProperty(key)
  })
})
