/**
 * Project icons come from the database, so `i-lucide-${project.icon}` is built
 * at runtime — Tailwind's scanner never sees it and generates no CSS.
 *
 * A static map keeps every class literal in the source, and gives an unknown
 * value a sensible fallback instead of an empty tile.
 */
const PROJECT_ICONS = {
  code: 'i-lucide-code',
  component: 'i-lucide-component',
  smartphone: 'i-lucide-smartphone',
  server: 'i-lucide-server',
  database: 'i-lucide-database',
  globe: 'i-lucide-globe',
  package: 'i-lucide-package',
  box: 'i-lucide-box',
  cloud: 'i-lucide-cloud',
  cpu: 'i-lucide-cpu',
  layers: 'i-lucide-layers',
  terminal: 'i-lucide-terminal',
  bot: 'i-lucide-bot',
  'shopping-cart': 'i-lucide-shopping-cart',
  'credit-card': 'i-lucide-credit-card',
} as const

export type ProjectIcon = keyof typeof PROJECT_ICONS

export const PROJECT_ICON_OPTIONS = Object.keys(PROJECT_ICONS) as ProjectIcon[]

export function projectIcon(name: string | null | undefined): string {
  return PROJECT_ICONS[name as ProjectIcon] ?? PROJECT_ICONS.code
}
