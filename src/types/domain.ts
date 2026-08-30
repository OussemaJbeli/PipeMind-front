/** Mirrors App\Enums in the backend. Kept as const arrays so they double as runtime guards. */

export const FAILURE_CATEGORIES = [
  'BUILD', 'TEST', 'DEPENDENCY', 'DATABASE', 'NETWORK', 'DOCKER', 'DEPLOYMENT',
  'CONFIGURATION', 'AUTHENTICATION', 'PERMISSION', 'INFRASTRUCTURE', 'RESOURCE', 'UNKNOWN',
] as const
export type FailureCategory = typeof FAILURE_CATEGORIES[number]

export const PIPELINE_STATUSES = [
  'queued', 'running', 'success', 'failed', 'canceled', 'skipped', 'manual', 'timeout',
] as const
export type PipelineStatus = typeof PIPELINE_STATUSES[number]

export type JobStatus = PipelineStatus

export const SEVERITIES = ['low', 'medium', 'high', 'critical'] as const
export type Severity = typeof SEVERITIES[number]
export type Risk = Severity

export type TeamRole = 'owner' | 'admin' | 'member' | 'viewer'
export type HealthStatus = 'healthy' | 'degraded' | 'failing' | 'unknown'
export type Trend = 'up' | 'down' | 'flat'
export type ActivityLevel = 'info' | 'success' | 'warning' | 'error'
export type ProviderType = 'gitlab' | 'github' | 'jenkins' | 'generic'
export type RangeKey = '24h' | '7d' | '30d' | '90d'

export type ActionType =
  | 'investigate' | 'retry_job' | 'retry_pipeline' | 'create_issue'
  | 'edit_file' | 'update_config' | 'update_dependency'
  | 'create_merge_request' | 'rollback_deployment' | 'manual'

export type ClassificationSource = 'rules' | 'ml' | 'llm' | 'hybrid'

/** Error codes the UI switches on. A failed analysis is not a failed pipeline. */
export type ApiErrorCode =
  | 'UNAUTHENTICATED' | 'TEAM_ACCESS_DENIED' | 'INSUFFICIENT_ROLE'
  | 'INTEGRATION_UNREACHABLE' | 'INTEGRATION_UNAUTHORIZED' | 'PROVIDER_RATE_LIMITED'
  | 'AI_SERVICE_UNAVAILABLE' | 'AI_BUDGET_EXCEEDED' | 'AI_PROVIDER_ERROR'
  | 'ANALYSIS_IN_PROGRESS' | 'ANALYSIS_FAILED' | 'LOG_NOT_AVAILABLE'
  | 'REMEDIATION_FORBIDDEN' | 'REMEDIATION_EXPIRED' | 'POLICY_LIMIT_REACHED'
