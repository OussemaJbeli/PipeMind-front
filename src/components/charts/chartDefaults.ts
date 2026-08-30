import {
  BarController, BarElement, CategoryScale, Chart, DoughnutController, Filler,
  Legend, LinearScale, LineController, LineElement, PointElement, Tooltip,
} from 'chart.js'

/**
 * Registered explicitly rather than via chart.js/auto: auto pulls in every
 * controller, scale and element (~2x the bundle) for the four chart types we use.
 */
Chart.register(
  LineController, BarController, DoughnutController,
  LineElement, PointElement, BarElement,
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

export const AXIS = {
  grid: { color: 'color-mix(in srgb, var(--pm-border) 60%, transparent)', drawTicks: false },
  border: { display: false },
  ticks: { padding: 8, maxRotation: 0, autoSkipPadding: 20 },
} as const

export { Chart }
