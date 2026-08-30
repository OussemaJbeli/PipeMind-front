import { computed, toValue, type MaybeRefOrGetter } from 'vue'

import type { ActivityLevel, PipelineStatus, Severity } from '@/types/domain'

export interface StatusMeta {
  label: string
  color: string
  bg: string
  icon: string
  /** Spin the icon — running states only. */
  spin?: boolean
}

/**
 * One source of truth for every status colour, icon and label.
 * No component may switch on a status string itself.
 */
export const PIPELINE_STATUS_META: Record<PipelineStatus, StatusMeta> = {
  success: { label: 'Success', color: 'var(--pm-success)', bg: 'color-mix(in srgb, var(--pm-success) 12%, transparent)', icon: 'i-lucide-check' },
  failed: { label: 'Failed', color: 'var(--pm-danger)', bg: 'color-mix(in srgb, var(--pm-danger) 12%, transparent)', icon: 'i-lucide-triangle-alert' },
  running: { label: 'Running', color: 'var(--pm-running)', bg: 'color-mix(in srgb, var(--pm-running) 12%, transparent)', icon: 'i-lucide-loader-circle', spin: true },
  queued: { label: 'Queued', color: 'var(--pm-text-dim)', bg: 'color-mix(in srgb, var(--pm-text-dim) 12%, transparent)', icon: 'i-lucide-clock' },
  canceled: { label: 'Canceled', color: 'var(--pm-text-mute)', bg: 'color-mix(in srgb, var(--pm-text-mute) 12%, transparent)', icon: 'i-lucide-circle-slash' },
  skipped: { label: 'Skipped', color: 'var(--pm-text-mute)', bg: 'color-mix(in srgb, var(--pm-text-mute) 12%, transparent)', icon: 'i-lucide-skip-forward' },
  manual: { label: 'Manual', color: 'var(--pm-warning)', bg: 'color-mix(in srgb, var(--pm-warning) 12%, transparent)', icon: 'i-lucide-hand' },
  timeout: { label: 'Timeout', color: 'var(--pm-warning)', bg: 'color-mix(in srgb, var(--pm-warning) 12%, transparent)', icon: 'i-lucide-timer-off' },
}

export const SEVERITY_META: Record<Severity, StatusMeta> = {
  low: { label: 'Low', color: 'var(--pm-text-dim)', bg: 'color-mix(in srgb, var(--pm-text-dim) 12%, transparent)', icon: 'i-lucide-info' },
  medium: { label: 'Medium', color: 'var(--pm-warning)', bg: 'color-mix(in srgb, var(--pm-warning) 12%, transparent)', icon: 'i-lucide-circle-alert' },
  high: { label: 'High', color: 'var(--pm-danger)', bg: 'color-mix(in srgb, var(--pm-danger) 12%, transparent)', icon: 'i-lucide-triangle-alert' },
  critical: { label: 'Critical', color: '#FF4D4D', bg: 'color-mix(in srgb, #FF4D4D 18%, transparent)', icon: 'i-lucide-octagon-alert' },
}

export const HEALTH_COLOR = {
  healthy: 'var(--pm-success)',
  degraded: 'var(--pm-warning)',
  failing: 'var(--pm-danger)',
  unknown: 'var(--pm-text-mute)',
} as const

export const LEVEL_COLOR: Record<ActivityLevel, string> = {
  info: 'var(--pm-text-dim)',
  success: 'var(--pm-success)',
  warning: 'var(--pm-warning)',
  error: 'var(--pm-danger)',
}

export function useStatusMeta(status: MaybeRefOrGetter<PipelineStatus>) {
  return computed(() => PIPELINE_STATUS_META[toValue(status)] ?? PIPELINE_STATUS_META.queued)
}

export function useSeverityMeta(severity: MaybeRefOrGetter<Severity>) {
  return computed(() => SEVERITY_META[toValue(severity)] ?? SEVERITY_META.medium)
}
