import type {
  ActionType, ActivityLevel, ClassificationSource, FailureCategory,
  HealthStatus, PipelineStatus, ProviderType, Severity, TeamRole, Trend,
} from './domain'

/* ── auth ────────────────────────────────────────────────────────────── */

export interface TeamSummary {
  uuid: string
  name: string
  slug: string
  role: TeamRole
  plan: string
  privacy_mode: 'cloud_redacted' | 'local_only'
}

export interface AuthUser {
  uuid: string
  name: string
  email: string
  avatar_url: string | null
  initials: string
  job_title: string | null
  theme: 'dark' | 'light' | 'system'
  timezone: string
  onboarded_at: string | null
  current_team: TeamSummary | null
  teams?: Array<Pick<TeamSummary, 'uuid' | 'name' | 'slug' | 'role'>>
  /** Derived from the role matrix server-side. Never re-derive from `role`. */
  permissions: string[]
  token?: string
}

/* ── metrics ─────────────────────────────────────────────────────────── */

export interface Metric {
  value: number
  unit?: string
  display?: string
  delta?: number
  delta_label?: string
  trend?: Trend
  /**
   * Which direction is good for THIS metric. Fewer failures is an improvement,
   * so a down arrow must render green. Colour is derived from this, never from
   * the sign of `delta`.
   */
  positive_direction?: 'up' | 'down'
  spark?: number[]
}

export interface WorkspaceSummary {
  projects: Metric
  pipelines_today: Metric
  failures_today: Metric
  success_rate: Metric
}

/* ── projects ────────────────────────────────────────────────────────── */

export interface LastPipeline {
  uuid: string
  iid: number
  status: PipelineStatus
  finished_at: string | null
  duration_seconds: number | null
}

export interface ProjectCard {
  uuid: string
  name: string
  slug: string
  icon: string
  color: string
  tech_stack: string[]
  /** Present only when the caller eager-loaded the integration. */
  provider?: string | null
  /** "Right now" — distinct from the 30-day success_rate. */
  health_status: HealthStatus
  success_rate: number
  failures_today: number
  pipelines_count: number
  last_pipeline: LastPipeline | null
}

export interface ProjectDetail extends Omit<ProjectCard, 'last_pipeline'> {
  description: string | null
  initials: string
  default_branch: string
  repository_url: string | null
  web_url: string | null
  provider: ProviderType | null
  is_active: boolean
  auto_analyze: boolean
  analyze_on_branches: string[]
}

/* ── activity ────────────────────────────────────────────────────────── */

export interface ActivityItem {
  uuid: string
  action: string
  level: ActivityLevel
  title: string
  description: string | null
  actor_type: 'user' | 'system' | 'ai' | 'provider'
  project?: { uuid: string, name: string, slug: string } | null
  subject_type: string | null
  subject_uuid: string | null
  created_at: string
}

/* ── pipelines ───────────────────────────────────────────────────────── */

export interface PipelineListItem {
  uuid: string
  iid: number
  status: PipelineStatus
  ref: string
  source: string
  provider: ProviderType
  commit_short_sha: string | null
  commit_message: string | null
  duration_seconds: number | null
  duration_display: string | null
  finished_at: string | null
  has_failure: boolean
  /** Present when has_failure — a failed row routes here, not to the pipeline. */
  failure_uuid: string | null
}

/* ── project board ───────────────────────────────────────────────────── */

export interface ChartPoint { x: string, y: number }

export interface ChartSeries {
  key: string
  label: string
  color: string
  points: ChartPoint[]
}

export interface ActivityChart {
  granularity: 'hourly' | 'daily' | 'weekly'
  series: ChartSeries[]
}

export interface CategorySlice {
  category: FailureCategory | 'OTHER'
  label: string
  icon?: string
  count: number
  percentage: number
  color: string
}

export interface FailureBreakdown {
  total: number
  items: CategorySlice[]
}

export interface ProjectInsight {
  type: 'anomaly' | 'pattern' | 'recurrence' | 'concentration' | 'trend' | 'flaky'
  headline: string
  detail: string | null
  severity: 'info' | 'warning' | 'critical'
  confidence: number
  action: { label: string, route: string, params: Record<string, string | number> } | null
}

export interface SuccessRateBar {
  date: string
  success_rate: number
  total: number
  failed: number
}

export interface ProjectOverview {
  project: {
    uuid: string
    name: string
    slug: string
    initials: string
    color: string
    icon: string
    tech_stack: string[]
    provider: ProviderType | null
    default_branch: string
    web_url: string | null
    health_status: HealthStatus
  }
  kpis: {
    pipeline_health: Metric
    pipelines: Metric
    failures: Metric
    avg_duration: Metric
    mttr: Metric
  }
  activity_chart: ActivityChart
  failure_breakdown: FailureBreakdown
  top_categories: CategorySlice[]
  insight: ProjectInsight | null
  recent_pipelines: PipelineListItem[]
  success_rate_chart: {
    value: number
    delta: number
    range: string
    bars: SuccessRateBar[]
  }
  recent_activity: ActivityItem[]
}

/* ── failures & analysis ─────────────────────────────────────────────── */

export interface ChangedFile {
  path: string
  change_type: 'added' | 'modified' | 'deleted' | 'renamed' | 'copied'
  additions: number
  deletions: number
  is_config: boolean
  is_dependency: boolean
  /** The unified diff hunk, when the provider returned one. */
  patch?: string | null
  patch_truncated?: boolean
}

export interface Evidence {
  type: 'log_line' | 'changed_file' | 'historical_failure' | 'metric' | 'config' | 'commit' | 'doc'
  content: string
  source_ref: string | null
  line_number: number | null
  related_failure_uuid?: string | null
  weight: number
}

export interface Analysis {
  uuid: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cached'
  /** Why the analysis failed. Present only when `status === 'failed'`. */
  error: string | null
  confidence: number
  summary: string
  root_cause: string
  explanation: string | null
  is_transient: boolean
  retry_recommended: boolean
  classification_source: ClassificationSource
  classification_confidence: number
  used_rag: boolean
  similar_failures_count: number
  model_provider: string | null
  model_name: string | null
  latency_ms: number | null
  cost_usd: number
  cache_hit: boolean
  completed_at: string | null
  evidence: Evidence[]
  feedback: { given: boolean, was_helpful: boolean | null }
}

export interface SimilarFailure {
  uuid: string
  similarity: number
  project_name: string
  occurred_at: string
  root_cause: string | null
  resolution: string | null
  resolved: boolean
}

export interface Recommendation {
  uuid: string
  title: string
  description: string | null
  rationale: string | null
  action_type: ActionType
  /** Assigned by the backend from action_type — never by the model. */
  risk: Severity
  confidence: number | null
  affected_files: string[]
  has_patch: boolean
  /**
   * A unified diff, already validated server-side: structurally sound and
   * scoped to files the model was actually shown. Never applied automatically.
   */
  patch?: string | null
  status: 'proposed' | 'accepted' | 'rejected' | 'applied' | 'failed' | 'expired'
  /**
   * Null until the remediation policy engine lands in roadmap 18. The UI must
   * degrade to "no gate shown" rather than assuming a decision — inventing
   * `auto_allowed` here would render an Apply button the backend cannot honour.
   */
  policy?: { decision: 'auto_allowed' | 'requires_approval' | 'forbidden', reason: string } | null
}

export type FailureStatus =
  | 'detected' | 'queued' | 'analyzing' | 'analyzed'
  | 'analysis_failed' | 'resolved' | 'ignored'

export type ResolutionType = 'fixed' | 'retried' | 'ignored' | 'auto_remediated' | 'flaky'

export interface FailureDetail {
  uuid: string
  status: FailureStatus
  severity: Severity
  category: FailureCategory
  /** Server-provided so the donut, the list and this page cannot disagree. */
  category_label: string
  category_color: string
  subcategory: string | null
  error_message: string | null
  error_type: string | null
  ecosystem: string | null
  resolved_at: string | null
  resolution_type: ResolutionType | null
  resolution_note: string | null
  stage_name: string | null
  job_name: string | null
  exit_code: number | null
  failed_at: string
  occurrence_index: number
  is_flaky: boolean
  is_transient: boolean

  project: { uuid: string, name: string, slug: string }
  pipeline: {
    uuid: string
    iid: number
    ref: string
    commit_short_sha: string | null
    commit_message: string | null
    web_url: string | null
  }
  job: { uuid: string, name: string, duration_seconds: number | null, web_url: string | null } | null

  /**
   * OBSERVED — facts collected from the pipeline.
   * Kept structurally separate from `analysis` on purpose: if they shared a shape,
   * some component would eventually render them identically and the distinction
   * the whole trust model rests on would quietly disappear.
   */
  observed: {
    changed_files: ChangedFile[]
    previous_pipeline: { iid: number, status: PipelineStatus, finished_at: string } | null
    /** Already redacted server-side. Rendered inline so the page needs no second request. */
    log_excerpt: string | null
    log_excerpt_start_line: number | null
    log_excerpt_url: string | null
  }

  /** INFERENCE. Never merge with `observed`. */
  analysis: Analysis | null
  similar_failures: SimilarFailure[]
  recommendations: Recommendation[]
}

/** The list shape. Far lighter than FailureDetail — a 25-row table needs none of it. */
export interface FailureListItem {
  uuid: string
  status: FailureStatus
  severity: Severity
  category: FailureCategory
  category_label: string
  category_color: string
  subcategory: string | null
  error_message: string | null
  stage_name: string | null
  job_name: string | null
  occurrence_index: number
  is_flaky: boolean
  is_transient: boolean
  failed_at: string | null
  failed_at_display: string | null
  resolved_at: string | null
  time_to_resolution_display: string | null
  project?: { uuid: string, name: string, slug: string, color: string | null }
  pipeline?: { uuid: string, iid: number, ref: string }
  analysis_confidence?: number | null
}

export interface JobLogPayload {
  available: boolean
  reason?: string
  mode?: 'excerpt' | 'full'
  excerpt: string | null
  excerpt_start_line: number | null
  excerpt_end_line: number | null
  error_block: string | null
  stack_trace: string | null
  line_count: number | null
  size_bytes: number | null
  truncated: boolean
  is_redacted: boolean
  redaction_count: number
  redaction_types: string[]
  content: string | null
}

export interface AnalysisFeedbackPayload {
  was_helpful: boolean
  root_cause_correct?: boolean | null
  correct_category?: FailureCategory | null
  actual_root_cause?: string | null
  actual_resolution?: string | null
  comment?: string | null
}


/* ── pipelines, analyses, signatures ─────────────────────────────────── */

export interface PipelineStage {
  name: string
  position: number
  status: string
  duration_seconds: number | null
  jobs_count: number
}

export interface PipelineJob {
  uuid: string
  name: string
  stage_name: string | null
  position: number
  status: string
  exit_code: number | null
  failure_reason: string | null
  duration_seconds: number | null
  allow_failure: boolean
  log_fetched: boolean
  web_url: string | null
}

export interface PipelineFailureSummary {
  uuid: string
  category: FailureCategory
  subcategory: string | null
  severity: Severity
  status: FailureStatus
  error_message: string | null
  job_name: string | null
  analysis_confidence: number | null
  analysis_summary: string | null
}

export interface PipelineDetail {
  uuid: string
  iid: number
  status: PipelineStatus
  source: string
  ref: string
  provider: string
  commit_sha: string | null
  commit_short_sha: string | null
  commit_message: string | null
  commit_author_name: string | null
  commit_url: string | null
  web_url: string | null
  duration_seconds: number | null
  queue_seconds: number | null
  jobs_total: number
  jobs_failed: number
  started_at: string | null
  finished_at: string | null
  project: { uuid: string, name: string, slug: string }
  stages: PipelineStage[]
  jobs: PipelineJob[]
  changes: ChangedFile[]
  failures: PipelineFailureSummary[]
}

export interface AnalysisListItem {
  uuid: string
  failure_uuid: string
  status: string
  category: FailureCategory | null
  subcategory: string | null
  confidence: number | null
  summary: string | null
  model_provider: string | null
  model_name: string | null
  cost_usd: number
  latency_ms: number | null
  cache_hit: boolean
  used_rag: boolean
  classification_source: ClassificationSource | null
  created_at: string
  /** null when nobody has judged it yet — distinct from "judged unhelpful". */
  was_helpful: boolean | null
}

export interface AnalysisTotals {
  analyses: number
  cost_usd: number
  avg_latency_ms: number
  avg_confidence: number
  cache_hit_rate: number
}

export interface SignatureItem {
  uuid: string
  hash: string
  category: FailureCategory
  subcategory: string | null
  sample_error: string
  occurrences: number
  resolved_count: number
  is_known: boolean
  known_root_cause: string | null
  known_resolution: string | null
  avg_resolution_seconds: number | null
  first_seen_at: string
  last_seen_at: string
  latest_failure_uuid: string | null
}

/* ── anomalies & analytics ───────────────────────────────────────────── */

export type AnomalyType =
  | 'duration' | 'memory' | 'failure_rate' | 'retry_rate'
  | 'queue_time' | 'test_count' | 'log_size' | 'flaky_test'

export interface AnomalyItem {
  uuid: string
  type: AnomalyType
  severity: Severity
  status: 'open' | 'acknowledged' | 'resolved' | 'false_positive'
  metric_name: string
  observed_value: number
  baseline_value: number
  deviation_ratio: number | null
  z_score: number | null
  detection_method: string
  title: string
  description: string | null
  possible_causes: string[]
  detected_at: string | null
  acknowledged_at: string | null
}

export interface ProjectAnalytics {
  range_days: number
  failure_trend: {
    days: string[]
    series: { category: string, label: string, color: string | null, points: number[] }[]
  }
  mttr_trend: {
    positive_direction: 'up' | 'down'
    points: { day: string, minutes: number, resolved: number }[]
  }
  /** cells[isoDayOfWeek 1-7][hour 0-23] — zero-filled, so the grid is never ragged. */
  heatmap: { max: number, cells: Record<string, Record<string, number>> }
  slowest_jobs: {
    job_name: string
    median_seconds: number
    p95_seconds: number | null
    sample_count: number
    failure_rate: number
  }[]
  flakiest_jobs: { job_name: string, failures: number, runs: number, flip_rate: number }[]
  top_signatures: {
    uuid: string
    category: string
    label: string
    color: string | null
    subcategory: string | null
    sample_error: string
    occurrences: number
    is_known: boolean
  }[]
  ai_performance: {
    analyses: number
    avg_confidence: number
    cost_usd: number
    avg_latency_ms: number
    cache_hit_rate: number
    rag_rate: number
    /** null when nobody has judged anything — not the same as 0% helpful. */
    helpful_rate: number | null
    feedback_count: number
    classification_sources: Record<string, number>
  }
}

export interface AiProvider {
  uuid: string
  name: string
  provider: string
  model: string
  base_url: string | null
  /** The key itself is never returned — `$hidden` on the model, and omitted here. */
  has_api_key: boolean
  is_default: boolean
  is_local: boolean
  max_tokens: number
  temperature: number
  input_cost_per_1k: number
  output_cost_per_1k: number
  status: 'untested' | 'active' | 'error' | 'disabled'
  last_tested_at: string | null
  last_error: string | null
  projects_count: number
}

/* ── envelopes ───────────────────────────────────────────────────────── */

export interface Envelope<T> { data: T }

export interface Paginated<T> {
  data: T[]
  meta: { current_page: number, per_page: number, total: number, last_page: number }
  links: { first: string | null, prev: string | null, next: string | null, last: string | null }
}

/* ── integrations ────────────────────────────────────────────────────── */

export interface IntegrationCapabilities {
  read_projects: boolean
  retry_jobs: boolean
  create_issues: boolean
}

export interface ConnectionIdentity {
  username: string
  name: string | null
  avatar_url: string | null
  scopes: string[]
  project_count: number | null
  capabilities: IntegrationCapabilities
}

export interface Integration {
  uuid: string
  provider: ProviderType
  name: string
  base_url: string | null
  instance_type: 'cloud' | 'self_hosted'
  status: 'pending' | 'active' | 'error' | 'disabled'
  scopes: string[]
  last_verified_at: string | null
  last_event_at: string | null
  last_error: string | null
  /** A dead webhook is invisible otherwise — silence looks like "nothing happened". */
  looks_stale: boolean
  webhook_url: string
  projects_count?: number
  created_at: string | null
}

export interface RemoteRepository {
  external_id: string
  name: string
  path: string
  description: string | null
  web_url: string | null
  default_branch: string
  last_activity_at: string | null
  already_imported: boolean
}

export interface ImportResult {
  external_id: string
  name: string
  slug?: string
  uuid?: string
  imported: boolean
  webhook: boolean
  error: string | null
}

export interface WebhookSettings {
  webhook_base_url: string
  reachable: boolean
}
