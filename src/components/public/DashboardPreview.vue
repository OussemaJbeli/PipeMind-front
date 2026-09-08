<script setup lang="ts">
/**
 * The product shot from `ui/landingPage.png`, built in markup.
 *
 * Rendered rather than screenshotted so it themes with the page, stays sharp on
 * any display and never goes stale against the real UI. The figures are
 * illustrative chrome — the same role they play in the mockup — and none of
 * them is presented as a measurement of PipeMind. The measured numbers live in
 * their own section, sourced from the evaluation run.
 */
const NAV = [
  { icon: 'i-lucide-house', label: 'Home', active: true },
  { icon: 'i-lucide-folder', label: 'Projects' },
  { icon: 'i-lucide-git-branch', label: 'Pipelines' },
  { icon: 'i-lucide-triangle-alert', label: 'Failures' },
  { icon: 'i-lucide-chart-column', label: 'Analytics' },
  { icon: 'i-lucide-plug', label: 'Integrations' },
  { icon: 'i-lucide-settings', label: 'Settings' },
]

const KPIS = [
  { label: 'Failure rate', value: '3.6%', delta: '−25% vs last week', good: true },
  { label: 'MTTR', value: '18m', delta: '−7m vs last week', good: true },
  { label: 'Total pipelines', value: '127', delta: '+18% vs yesterday', good: true },
]

const TABS = ['Overview', 'Logs', 'Analysis', 'Fixes']

// A plausible success-rate curve. Points, not an image, so it scales cleanly.
const SPARK = '0,34 14,28 28,31 42,18 56,22 70,12 84,16 98,7 112,10 126,4'
</script>

<template>
  <div
    class="pm-frame overflow-hidden rounded-[var(--pm-radius-lg)] border bg-[var(--pm-bg)]"
    role="img"
    aria-label="The PipeMind dashboard: a failed pipeline, key metrics, and an AI analysis panel"
  >
    <div class="flex text-[9px] leading-none">
      <!-- sidebar -->
      <aside class="hidden w-[104px] shrink-0 border-r bg-sidebar p-2 sm:block">
        <div class="mb-3 flex items-center gap-1.5 px-1 py-1">
          <PmLogo class="size-3.5" />
          <span class="text-[10px] font-semibold">PipeMind</span>
        </div>

        <div
          v-for="item in NAV"
          :key="item.label"
          class="mb-0.5 flex items-center gap-1.5 rounded px-1.5 py-1.5"
          :class="item.active ? 'bg-surface-2 text-fg' : 'text-mute'"
        >
          <i :class="item.icon" class="size-2.5 shrink-0" />
          <span>{{ item.label }}</span>
        </div>
      </aside>

      <!-- main -->
      <div class="min-w-0 flex-1 p-2.5">
        <!-- topbar -->
        <div class="mb-2.5 flex items-center gap-2">
          <div class="flex h-5 flex-1 items-center gap-1.5 rounded border bg-surface px-1.5 text-mute">
            <i-lucide-search class="size-2.5" />Search…
          </div>
          <i-lucide-bell class="size-2.5 text-mute" />
          <span class="size-4 rounded-full bg-[var(--pm-surface-3)]" />
        </div>

        <!-- the failure banner, the thing the whole product is about -->
        <div
          class="mb-2.5 flex items-center gap-2 rounded border p-2"
          :style="{ borderColor: 'color-mix(in oklab, var(--pm-danger) 40%, transparent)',
                    background: 'color-mix(in oklab, var(--pm-danger) 8%, transparent)' }"
        >
          <i-lucide-circle-x class="size-3 shrink-0" :style="{ color: 'var(--pm-danger)' }" />
          <div class="min-w-0 flex-1">
            <p class="font-semibold">Pipeline #821 failed</p>
            <p class="mt-0.5 text-mute">2 min ago · backend-tests</p>
          </div>
          <span
            class="rounded px-1.5 py-0.5 font-medium"
            :style="{ background: 'color-mix(in oklab, var(--pm-danger) 16%, transparent)',
                      color: 'var(--pm-danger)' }"
          >Failed</span>
          <span class="hidden rounded border px-1.5 py-0.5 sm:block">View details</span>
        </div>

        <!-- tabs -->
        <div class="mb-2.5 flex gap-3 border-b pb-1.5">
          <span
            v-for="(tab, index) in TABS"
            :key="tab"
            :class="index === 0 ? 'border-b-2 pb-1.5 font-medium text-fg' : 'text-mute'"
            :style="index === 0 ? { borderColor: 'var(--pm-accent)' } : {}"
          >{{ tab }}</span>
        </div>

        <!-- KPIs -->
        <div class="mb-2.5 grid grid-cols-3 gap-1.5">
          <div v-for="kpi in KPIS" :key="kpi.label" class="rounded border bg-surface p-1.5">
            <p class="text-mute">{{ kpi.label }}</p>
            <p class="mt-1 text-[15px] font-semibold leading-none">{{ kpi.value }}</p>
            <p class="mt-1 text-accent">{{ kpi.delta }}</p>
          </div>
        </div>

        <!-- chart + AI panel -->
        <div class="grid gap-1.5 sm:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
          <div class="rounded border bg-surface p-2">
            <p class="mb-1.5 font-medium">Pipeline success rate</p>
            <svg viewBox="0 0 126 40" class="h-12 w-full" fill="none" preserveAspectRatio="none">
              <defs>
                <linearGradient id="pm-spark" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" :stop-color="'var(--pm-accent)'" stop-opacity="0.35" />
                  <stop offset="100%" :stop-color="'var(--pm-accent)'" stop-opacity="0" />
                </linearGradient>
              </defs>
              <polygon :points="`${SPARK} 126,40 0,40`" fill="url(#pm-spark)" />
              <polyline
                class="pm-spark-line"
                :points="SPARK"
                stroke="var(--pm-accent)"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </div>

          <div
            class="rounded border p-2"
            :style="{ borderColor: 'color-mix(in oklab, var(--pm-accent) 30%, transparent)',
                      background: 'color-mix(in oklab, var(--pm-accent) 6%, transparent)' }"
          >
            <p class="mb-1 flex items-center gap-1 font-medium">
              <i-lucide-sparkles class="size-2.5 text-accent" />AI analysis
            </p>
            <p class="leading-relaxed text-dim">
              The build failed because <span class="font-mono">package.json</span> is
              missing the required script. Likely caused by a recent commit…
            </p>
            <span
              class="mt-1.5 inline-block rounded px-1.5 py-1 font-medium"
              :style="{ background: 'var(--pm-accent)', color: 'var(--pm-bg)' }"
            >View full analysis →</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pm-frame {
  box-shadow:
    0 0 0 1px color-mix(in oklab, var(--pm-accent) 10%, transparent),
    0 30px 80px -30px color-mix(in oklab, var(--pm-accent) 30%, transparent);
}

/* The line draws itself once the section scrolls in. */
.pm-spark-line {
  stroke-dasharray: 200;
  stroke-dashoffset: 200;
  animation: pm-draw 1.8s 0.2s ease-out forwards;
}

@keyframes pm-draw {
  to { stroke-dashoffset: 0; }
}

@media (prefers-reduced-motion: reduce) {
  .pm-spark-line { animation: none; stroke-dashoffset: 0; }
}
</style>
