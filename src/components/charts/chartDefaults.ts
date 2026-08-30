import {
  ArcElement, BarController, BarElement, CategoryScale, Chart, DoughnutController,
  Filler, Legend, LinearScale, LineController, LineElement, PointElement, Tooltip,
} from 'chart.js'

/**
 * Registered explicitly rather than via chart.js/auto: auto pulls in every
 * controller, scale and element (~2x the bundle) for the four chart types we use.
 */
Chart.register(
  LineController, BarController, DoughnutController,
  LineElement, PointElement, BarElement, ArcElement,
  CategoryScale, LinearScale,
  Filler, Tooltip, Legend,
)

let applied = false

/** Reads CSS custom properties so charts follow the active theme. */
function token(name: string, fallback: string): string {
  if (typeof window === 'undefined')
    return fallback

  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback
}

export function applyChartDefaults() {
  Chart.defaults.font.family = 'Inter, system-ui, sans-serif'
  Chart.defaults.font.size = 11
  Chart.defaults.color = token('--pm-text-mute', '#5C6472')
  Chart.defaults.borderColor = token('--pm-border', '#1F242C')
  Chart.defaults.maintainAspectRatio = false
  Chart.defaults.animation = { duration: 300, easing: 'easeOutQuart' }

  // Legends are rendered in Vue, not on the canvas: the mockup's legends carry
  // colour dots, counts and percentages, and its Failure Breakdown rows are
  // clickable filters. A canvas legend can do none of that.
  Chart.defaults.plugins.legend.display = false

  Object.assign(Chart.defaults.plugins.tooltip, {
    backgroundColor: token('--pm-surface-2', '#161A21'),
    borderColor: token('--pm-border', '#1F242C'),
    borderWidth: 1,
    padding: 10,
    cornerRadius: 8,
    titleColor: token('--pm-text', '#E7EAF0'),
    bodyColor: token('--pm-text-dim', '#8B93A1'),
    titleFont: { weight: 600, size: 12 },
    bodyFont: { size: 12 },
    displayColors: true,
    boxPadding: 4,
    boxWidth: 8,
    boxHeight: 8,
    usePointStyle: true,
  })

  applied = true
}

/** Re-read tokens after a theme switch, then repaint every live chart. */
export function refreshChartTheme() {
  applyChartDefaults()

  for (const chart of Object.values(Chart.instances))
    chart.update('none')
}

export function ensureChartDefaults() {
  if (!applied)
    applyChartDefaults()
}

/**
 * Canvas cannot parse CSS functions: neither `var(--x)` nor `color-mix(...)`
 * reaches ctx.fillStyle or addColorStop as a usable value. Every colour handed
 * to Chart.js has to be resolved to a literal first.
 */
export function resolveColor(value: string, fallback = '#A9E831'): string {
  if (typeof window === 'undefined')
    return fallback

  const trimmed = value.trim()

  if (!trimmed.startsWith('var('))
    return trimmed

  const name = trimmed.slice(4, -1).split(',')[0]?.trim() ?? ''
  const resolved = getComputedStyle(document.documentElement).getPropertyValue(name).trim()

  return resolved || fallback
}

/** Literal rgba, safe for addColorStop. */
export function withAlpha(color: string, alpha: number): string {
  const resolved = resolveColor(color)

  if (resolved.startsWith('#')) {
    const hex = resolved.slice(1)
    const full = hex.length === 3 ? hex.split('').map(c => c + c).join('') : hex
    const int = Number.parseInt(full, 16)

    return `rgba(${(int >> 16) & 255}, ${(int >> 8) & 255}, ${int & 255}, ${alpha})`
  }

  const nums = resolved.match(/[\d.]+/g)
  if (nums && nums.length >= 3)
    return `rgba(${nums[0]}, ${nums[1]}, ${nums[2]}, ${alpha})`

  return resolved
}

export const AXIS = {
  grid: { color: withAlpha('var(--pm-border)', 0.6), drawTicks: false },
  border: { display: false },
  ticks: { padding: 8, maxRotation: 0, autoSkipPadding: 20 },
} as const

export { Chart }
