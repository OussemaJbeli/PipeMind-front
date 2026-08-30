import type { ActionType, Severity } from '@/types/domain'

export const ACTION_META: Record<ActionType, { label: string, icon: string }> = {
  investigate: { label: 'Investigate', icon: 'i-lucide-search' },
  retry_job: { label: 'Retry job', icon: 'i-lucide-refresh-cw' },
  retry_pipeline: { label: 'Retry pipeline', icon: 'i-lucide-rotate-cw' },
  create_issue: { label: 'Create issue', icon: 'i-lucide-circle-dot' },
  edit_file: { label: 'Edit file', icon: 'i-lucide-file-pen' },
  update_config: { label: 'Update config', icon: 'i-lucide-settings-2' },
  update_dependency: { label: 'Update dependency', icon: 'i-lucide-package' },
  create_merge_request: { label: 'Create merge request', icon: 'i-lucide-git-pull-request' },
  rollback_deployment: { label: 'Rollback deployment', icon: 'i-lucide-undo-2' },
  manual: { label: 'Manual action', icon: 'i-lucide-hand' },
}

/**
 * What actually happens, in plain language, shown before the button.
 * "Apply Fix" with no visible consequence is how trust gets destroyed.
 */
export const RISK_CONSEQUENCE: Record<Severity, string> = {
  low: 'This is reversible and affects only this pipeline run.',
  medium: 'This changes files in your repository. Review the diff before approving.',
  high: 'This changes configuration that affects future runs.',
  critical: 'This affects a live environment and cannot be undone automatically.',
}
