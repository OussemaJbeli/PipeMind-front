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
  status: 'proposed' | 'accepted' | 'rejected' | 'applied' | 'failed' | 'expired'
  policy: { decision: 'auto_allowed' | 'requires_approval' | 'forbidden', reason: string } | null
}

export interface FailureDetail {
  uuid: string
  status: string
  severity: Severity
  category: FailureCategory
  subcategory: string | null
  error_message: string | null
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
    log_excerpt_url: string
  }

  /** INFERENCE. Never merge with `observed`. */
  analysis: Analysis | null
  similar_failures: SimilarFailure[]
  recommendations: Recommendation[]
}

/* ── envelopes ───────────────────────────────────────────────────────── */

export interface Envelope<T> { data: T }

export interface Paginated<T> {
  data: T[]
  meta: { current_page: number, per_page: number, total: number, last_page: number }
  links: { first: string | null, prev: string | null, next: string | null, last: string | null }
}
