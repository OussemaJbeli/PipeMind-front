import type { FailureCategory } from '@/types/domain'

export interface CategoryMeta {
  label: string
  color: string
  icon: string
}

/**
 * Colours MUST match App\Enums\FailureCategory::color() in the backend.
 * The donut, the category bars and the pills all read from here, so they can
 * never disagree with each other — but they can drift from the API if this
 * table is edited alone. A unit test asserts they match.
 */
export const CATEGORY_META: Record<FailureCategory, CategoryMeta> = {
  DATABASE: { label: 'Database', color: '#A9E831', icon: 'i-lucide-database' },
  TEST: { label: 'Tests', color: '#F04438', icon: 'i-lucide-flask-conical' },
  DEPENDENCY: { label: 'Dependencies', color: '#F5A524', icon: 'i-lucide-package' },
  DOCKER: { label: 'Docker', color: '#38BDF8', icon: 'i-lucide-container' },
  NETWORK: { label: 'Network', color: '#6366F1', icon: 'i-lucide-wifi-off' },
  BUILD: { label: 'Build', color: '#EC4899', icon: 'i-lucide-hammer' },
  DEPLOYMENT: { label: 'Deployment', color: '#14B8A6', icon: 'i-lucide-rocket' },
  CONFIGURATION: { label: 'Configuration', color: '#A855F7', icon: 'i-lucide-settings-2' },
  AUTHENTICATION: { label: 'Authentication', color: '#F97316', icon: 'i-lucide-key-round' },
  PERMISSION: { label: 'Permission', color: '#8B5CF6', icon: 'i-lucide-lock' },
  INFRASTRUCTURE: { label: 'Infrastructure', color: '#0EA5E9', icon: 'i-lucide-server' },
  RESOURCE: { label: 'Resource', color: '#EAB308', icon: 'i-lucide-cpu' },
  UNKNOWN: { label: 'Unknown', color: '#5C6472', icon: 'i-lucide-circle-help' },
}

const FALLBACK: CategoryMeta = { label: 'Other', color: '#5C6472', icon: 'i-lucide-circle' }

/** Unknown categories degrade to a neutral entry so the backend can add one safely. */
export function categoryMeta(category: string): CategoryMeta {
  return CATEGORY_META[category as FailureCategory] ?? FALLBACK
}
