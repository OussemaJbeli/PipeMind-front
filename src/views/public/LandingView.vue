<script setup lang="ts">
import { useEventListener } from '@vueuse/core'
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'

const auth = useAuthStore()
const ui = useUiStore()
const router = useRouter()

/*
 * Nav links are anchors to sections that exist. The mockup has Pricing and
 * About; neither has a page, and a nav link to a 404 is worse than a shorter
 * nav.
 */
const NAV = [
  { label: 'Features', id: 'features' },
  { label: 'Integrations', id: 'integrations' },
  { label: 'Workspace', id: 'product' },
  { label: 'Results', id: 'results' },
]

const FEATURES = [
  { icon: 'i-lucide-brain', tone: 'var(--pm-info)', title: 'AI-powered analysis',
    line: 'Understand failures with context, logs and historical data.' },
  { icon: 'i-lucide-database', tone: 'var(--pm-ai)', title: 'Project context',
    line: 'Uses your codebase, history and environment for better results.' },
  { icon: 'i-lucide-zap', tone: 'var(--pm-accent)', title: 'Faster resolution',
    line: 'Reduce MTTR and keep your team productive.' },
  // The mockup says "(or auto-fix)". Remediation is policy-gated and always
  // proposes a merge request — it never edits your repository on its own — so
  // the claim is narrowed to what actually ships.
  { icon: 'i-lucide-file-diff', tone: 'var(--pm-accent)', title: 'Actionable fixes',
    line: 'A real diff — the exact line, not "check your recent changes".' },
  { icon: 'i-lucide-triangle-alert', tone: 'var(--pm-warning)', title: 'Detect anomalies',
    line: 'Find unusual patterns before they become critical.' },
  { icon: 'i-lucide-git-branch', tone: 'var(--pm-success)', title: 'Works everywhere',
    line: 'GitLab, GitHub Actions, Jenkins and more.' },
]

const STEPS = [
  { n: '01', title: 'Code push', icon: 'i-lucide-git-commit-horizontal',
    line: 'Your pipeline runs exactly as it does today. PipeMind watches by webhook.' },
  { n: '02', title: 'Pipeline monitor', icon: 'i-lucide-radar',
    line: 'Every job, log and changed file — normalised, redacted, and stored.' },
  { n: '03', title: 'Analysis & fix', icon: 'i-lucide-sparkles',
    line: 'The cause, the evidence, and where it is certain, the patch.' },
]

/*
 * Real numbers, from `PipeMind-data/experiments/` and the evaluation run — not
 * a testimonial. The mockup's social-proof band names real companies and an
 * invented engineer; presented as endorsement that is simply a false claim, and
 * these are more interesting anyway.
 */
const MEASURED = [
  { value: '4.1 s', label: 'median analysis', note: 'webhook to answer' },
  { value: '$0.0015', label: 'per failure', note: 'measured over 50 real calls' },
  { value: '3.2×', label: 'deduplication', note: 'failures collapsed into distinct problems' },
  { value: '100%', label: 'citations verifiable', note: 'every evidence item resolves' },
]

const INTEGRATIONS = [
  { icon: 'i-simple-icons-gitlab', label: 'GitLab' },
  { icon: 'i-simple-icons-github', label: 'GitHub' },
  { icon: 'i-simple-icons-githubactions', label: 'GitHub Actions' },
  { icon: 'i-simple-icons-jenkins', label: 'Jenkins' },
  { icon: 'i-simple-icons-docker', label: 'Docker' },
  { icon: 'i-lucide-webhook', label: 'Any webhook' },
]

interface FooterLink { label: string, href?: string, to?: string }

const FOOTER: { heading: string, links: FooterLink[] }[] = [
  { heading: 'Product', links: [
    { label: 'Features', href: '#features' },
    { label: 'Integrations', href: '#integrations' },
    { label: 'How it works', href: '#how' },
  ] },
  { heading: 'Get started', links: [
    { label: 'Create an account', to: 'register' },
    { label: 'Sign in', to: 'login' },
  ] },
]

/* ── scroll observers ──────────────────────────────────────────────────
 *
 * Set up ONCE in onMounted, never in a template ref.
 *
 * These previously lived in inline `:ref="el => ..."` callbacks, which Vue runs
 * on every render. Each run built a fresh IntersectionObserver whose callback
 * wrote to a ref — triggering a render, which built another observer, and so on.
 * Observers accumulated without bound and the main thread never came back: the
 * page looked frozen and nothing else on it could be clicked.
 */

const seen = ref(new Set<string>())
const active = ref('')
const showTop = ref(false)

let observers: IntersectionObserver[] = []

onMounted(() => {
  document.title = 'PipeMind — fix CI/CD failures faster with AI'

  const meta = document.querySelector('meta[name="description"]')
    ?? document.head.appendChild(Object.assign(document.createElement('meta'), { name: 'description' }))

  meta.setAttribute(
    'content',
    'PipeMind monitors your pipelines, analyses failures, understands your project '
    + 'context and gives you clear, actionable solutions. GitLab, GitHub Actions and Jenkins.',
  )

  const sections = [...document.querySelectorAll<HTMLElement>('[data-section]')]

  // Reveal on first sight, then stop watching that section for good.
  const revealer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting)
        continue

      const key = (entry.target as HTMLElement).dataset.section

      if (key) {
        seen.value = new Set([...seen.value, key])
        revealer.unobserve(entry.target)
      }
    }
  }, { threshold: 0.08 })

  /*
   * Active nav link. A band across the middle of the viewport rather than a
   * visibility threshold: sections here are taller than the screen, so
   * `threshold: 0.4` could never be reached and no link ever lit up.
   */
  const spy = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      const key = (entry.target as HTMLElement).dataset.section

      if (entry.isIntersecting && key)
        active.value = key
    }
  }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 })

  for (const section of sections) {
    revealer.observe(section)
    spy.observe(section)
  }

  observers = [revealer, spy]
})

onBeforeUnmount(() => {
  for (const observer of observers)
    observer.disconnect()

  observers = []
})

// Passive: this fires on every scroll frame and must never block it.
useEventListener(window, 'scroll', () => {
  showTop.value = window.scrollY > 600
}, { passive: true })

const mobileNav = ref(false)

// `scrollIntoView({ behavior: 'smooth' })` overrides the CSS `scroll-behavior:
// auto` that main.css sets under prefers-reduced-motion, so the preference has
// to be re-checked here or the JS path quietly ignores it.
function scrollBehavior(): ScrollBehavior {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
}

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: scrollBehavior(), block: 'start' })
}

function toTop() {
  window.scrollTo({ top: 0, behavior: scrollBehavior() })
}

</script>

<template>
  <div class="min-h-screen bg-[var(--pm-bg)]">
    <!-- ══ NAV ══ -->
    <header class="sticky top-0 z-40 border-b bg-[color:var(--pm-bg)]/85 backdrop-blur-md">
      <nav class="mx-auto flex max-w-6xl items-center gap-6 px-6 py-3.5">
        <RouterLink to="/" class="flex shrink-0 items-center gap-2.5">
          <PmLogo class="size-7" />
          <span class="font-semibold">PipeMind</span>
        </RouterLink>

        <div class="hidden items-center gap-1 md:flex">
          <button
            v-for="item in NAV"
            :key="item.id"
            type="button"
            class="relative px-3 py-1.5 text-[13px] font-medium transition-colors"
            :class="active === item.id ? 'text-fg' : 'text-dim hover:text-fg'"
            @click="scrollTo(item.id)"
          >
            {{ item.label }}
            <span
              v-if="active === item.id"
              class="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-[var(--pm-accent)]"
            />
          </button>
        </div>

        <div class="ml-auto flex items-center gap-2">
          <button
            class="rounded-[var(--pm-radius)] p-2 text-dim transition-colors hover:bg-surface-2 hover:text-fg"
            :aria-label="`Switch to ${ui.resolvedTheme === 'dark' ? 'light' : 'dark'} theme`"
            @click="ui.toggleTheme()"
          >
            <i :class="ui.resolvedTheme === 'dark' ? 'i-lucide-sun' : 'i-lucide-moon'" class="size-4" />
          </button>

          <template v-if="auth.isAuthenticated">
            <PmButton variant="primary" size="sm" @click="router.push({ name: 'workspace' })">
              Open workspace
            </PmButton>
          </template>
          <template v-else>
            <RouterLink
              :to="{ name: 'login' }"
              class="hidden px-3 text-[13px] font-medium text-dim hover:text-fg sm:block"
            >
              Sign in
            </RouterLink>
            <PmButton variant="primary" size="sm" @click="router.push({ name: 'register' })">
              Get started <i-lucide-arrow-right class="size-3.5" />
            </PmButton>
          </template>

          <button
            class="rounded p-2 text-dim md:hidden"
            aria-label="Menu"
            @click="mobileNav = !mobileNav"
          >
            <i :class="mobileNav ? 'i-lucide-x' : 'i-lucide-menu'" class="size-4" />
          </button>
        </div>
      </nav>

      <div v-if="mobileNav" class="border-t px-6 py-3 md:hidden">
        <button
          v-for="item in NAV"
          :key="item.id"
          type="button"
          class="block w-full py-2 text-left text-sm text-dim"
          @click="scrollTo(item.id); mobileNav = false"
        >{{ item.label }}</button>
      </div>
    </header>

    <!-- ══ HERO ══ -->
    <section class="relative overflow-hidden px-6 pb-16 pt-14 sm:pt-20">
      <!-- Decorative wash; the 3-D render drops in behind this when it exists. -->
      <div
        aria-hidden="true"
        class="pointer-events-none absolute left-1/2 top-0 -z-10 h-[520px] w-[900px] -translate-x-1/2 rounded-full opacity-[0.13] blur-[120px]"
        :style="{ background: 'radial-gradient(circle, var(--pm-accent), transparent 70%)' }"
      />

      <div class="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        <div>
          <span
            class="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[12px] font-medium"
            :style="{ borderColor: 'color-mix(in oklab, var(--pm-accent) 45%, transparent)',
                      background: 'color-mix(in oklab, var(--pm-accent) 10%, transparent)' }"
          >
            <i-lucide-sparkles class="size-3.5 text-accent" />
            AI-Powered CI/CD Failure Analysis
          </span>

          <h1 class="mt-5 text-4xl font-bold leading-[1.03] tracking-tight sm:text-5xl lg:text-[3.9rem]">
            Fix CI/CD Failures<br>
            <span class="pm-gradient-text">Faster</span> with AI.
          </h1>

          <p class="mt-5 max-w-[48ch] text-[15px] leading-relaxed text-dim">
            PipeMind monitors your pipelines, analyses failures, understands your
            project context and gives you clear, actionable
            <span class="font-semibold text-fg">solutions</span> — so you can focus
            on building, not debugging.
          </p>

          <div class="mt-7 flex flex-wrap items-center gap-3">
            <PmButton variant="primary" size="lg" @click="router.push({ name: 'register' })">
              Get started free <i-lucide-arrow-right class="size-4" />
            </PmButton>
            <!--
              Deliberately not "Watch demo": there is no video, and a play button
              that opens nothing is a broken promise in the first screenful.
            -->
            <PmButton variant="outline" size="lg" @click="scrollTo('product')">
              See it in action
            </PmButton>
          </div>

          <ul class="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-[12px] text-mute">
            <li v-for="tick in ['No credit card required', 'Setup in minutes', 'Works with your tools']" :key="tick" class="flex items-center gap-1.5">
              <i-lucide-check class="size-3.5 text-accent" />{{ tick }}
            </li>
          </ul>
        </div>

        <!--
          Kept from v1 on purpose: HeroDemo renders the real AnalysisPanel with
          static data. It IS the product's output, which is a stronger claim than
          any render — the 3-D art belongs behind it, not instead of it.
        -->
        <div class="relative lg:pl-2">
          <PipelineScene />

          <!--
            Kept below the scene rather than replaced by it: HeroDemo renders the
            real AnalysisPanel with static data, so it IS the product's output.
            The scene above is an illustration; this is evidence.
          -->
          <div class="mt-4 hidden xl:block">
            <HeroDemo />
          </div>
        </div>
      </div>
    </section>

    <!-- ══ FEATURES ══ -->
    <section
      id="features"
      data-section="features"
      class="scroll-mt-20 border-t px-6 py-20 transition-all duration-500"
      :class="seen.has('features') ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'"
    >
      <div class="mx-auto max-w-6xl">
        <span class="pm-pill">Why PipeMind?</span>
        <h2 class="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Smart Analysis. Real Impact.</h2>
        <p class="mt-3 max-w-[56ch] text-sm leading-relaxed text-dim">
          We combine the power of AI with deep DevOps knowledge to help you detect,
          understand and fix CI/CD failures in seconds — not hours.
        </p>

        <div class="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div
            v-for="feature in FEATURES"
            :key="feature.title"
            class="pm-feature rounded-[var(--pm-radius-lg)] border bg-surface p-5"
          >
            <span
              class="inline-grid size-9 place-items-center rounded-[var(--pm-radius)]"
              :style="{ background: `color-mix(in oklab, ${feature.tone} 14%, transparent)`, color: feature.tone }"
            >
              <i :class="feature.icon" class="size-4.5" />
            </span>
            <h3 class="mt-3.5 text-[15px] font-medium">{{ feature.title }}</h3>
            <p class="mt-1.5 text-[13px] leading-relaxed text-dim">{{ feature.line }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ══ INTEGRATIONS ══ -->
    <section
      id="integrations"
      data-section="integrations"
      class="scroll-mt-20 border-t px-6 py-20 transition-all duration-500"
      :class="seen.has('integrations') ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'"
    >
      <div class="mx-auto grid max-w-6xl gap-12 lg:grid-cols-2 lg:items-center">
        <div>
          <span class="pm-pill">Integrations</span>
          <h2 class="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Connect Your CI/CD Tools</h2>
          <p class="mt-3 max-w-[50ch] text-sm leading-relaxed text-dim">
            PipeMind integrates with the platforms you already run and listens to
            your pipelines in real time — it watches, it does not sit in the path.
          </p>

          <div class="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div
              v-for="tool in INTEGRATIONS"
              :key="tool.label"
              class="pm-tool grid place-items-center gap-2 rounded-[var(--pm-radius-lg)] border bg-surface px-3 py-4 text-center"
            >
              <i :class="tool.icon" class="size-6 shrink-0" />
              <span class="truncate text-[11px] font-medium">{{ tool.label }}</span>
            </div>
          </div>
        </div>

        <div id="how" class="scroll-mt-20 space-y-3">
          <div
            v-for="(step, index) in STEPS"
            :key="step.n"
            class="relative rounded-[var(--pm-radius-lg)] border bg-surface p-4"
          >
            <!-- Inline SVG connector: crisp at any zoom, themes correctly, and
                 no asset to ship. -->
            <svg
              v-if="index < STEPS.length - 1"
              aria-hidden="true"
              class="absolute -bottom-3 left-8 h-3 w-px overflow-visible"
            >
              <line
                x1="0" y1="0" x2="0" y2="12"
                stroke="var(--pm-accent)" stroke-width="1.5"
                stroke-dasharray="3 3" opacity="0.5"
              />
            </svg>

            <div class="flex items-start gap-3.5">
              <span
                class="grid size-9 shrink-0 place-items-center rounded-[var(--pm-radius)]"
                :style="{ background: 'color-mix(in oklab, var(--pm-accent) 12%, transparent)' }"
              >
                <i :class="step.icon" class="size-4 text-accent" />
              </span>
              <div class="min-w-0">
                <p class="text-[11px] font-mono text-mute">{{ step.n }}</p>
                <h3 class="text-[15px] font-medium">{{ step.title }}</h3>
                <p class="mt-1 text-[13px] leading-relaxed text-dim">{{ step.line }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ══ PRODUCT ══ -->
    <section
      id="product"
      data-section="product"
      class="scroll-mt-20 border-t px-6 py-20 transition-all duration-500"
      :class="seen.has('product') ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'"
    >
      <div class="mx-auto grid max-w-6xl gap-12 lg:grid-cols-2 lg:items-center">
        <!--
          Reserved for a real capture of the running app. Deliberately NOT a
          drawn mockup: this is the most load-bearing honesty on the page, and a
          fabricated dashboard is the one thing a reviewer will check.
        -->
        <DashboardPreview />

        <div>
          <span class="pm-pill">Your Workspace</span>
          <h2 class="mt-3 text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
            Complete visibility,<br>full control.
          </h2>
          <p class="mt-3 max-w-[46ch] text-sm leading-relaxed text-dim">
            Get a unified view of your pipelines, failures and performance — with
            AI insights right where you need them.
          </p>

          <ul class="mt-6 space-y-2.5">
            <li
              v-for="point in [
                'Real-time pipeline monitoring',
                'Detailed logs and error analysis',
                'AI-powered root cause detection',
                'Historical trends and reports',
                'Anomaly detection on your own baselines',
              ]"
              :key="point"
              class="flex items-start gap-2.5 text-[13px] leading-relaxed"
            >
              <span
                class="mt-px grid size-4 shrink-0 place-items-center rounded-full"
                :style="{ background: 'color-mix(in oklab, var(--pm-accent) 18%, transparent)' }"
              >
                <i-lucide-check class="size-2.5 text-accent" />
              </span>
              {{ point }}
            </li>
          </ul>

          <PmButton variant="outline" class="mt-7" @click="router.push({ name: 'register' })">
            Explore the platform <i-lucide-arrow-right class="size-4" />
          </PmButton>
        </div>
      </div>
    </section>

    <!-- ══ RESULTS ══ -->
    <section
      id="results"
      data-section="results"
      class="scroll-mt-20 border-t px-6 py-20 transition-all duration-500"
      :class="seen.has('results') ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'"
    >
      <div class="mx-auto max-w-6xl">
        <span class="pm-pill">Measured, not claimed</span>
        <h2 class="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">The numbers behind it</h2>
        <p class="mt-2 max-w-[62ch] text-sm text-dim">
          From real analyses of real failures. Every figure traces to a committed
          experiment — including the ones that did not go our way.
        </p>

        <div class="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div
            v-for="item in MEASURED"
            :key="item.label"
            class="pm-feature rounded-[var(--pm-radius-lg)] border bg-surface p-5"
          >
            <p class="text-2xl font-bold tracking-tight text-accent">{{ item.value }}</p>
            <p class="mt-1 text-[13px] font-medium">{{ item.label }}</p>
            <p class="mt-0.5 text-[11px] leading-relaxed text-mute">{{ item.note }}</p>
          </div>
        </div>

        <p class="mt-5 text-[12px] leading-relaxed text-mute">
          Accuracy is not on this list on purpose. Validating it needs human-graded
          root causes, and that work is still in progress — the report says so
          rather than estimating.
        </p>
      </div>
    </section>

    <!-- ══ CTA ══ -->
    <section class="relative overflow-hidden border-t px-6 py-20">
      <div aria-hidden="true" class="pm-waves">
        <span class="pm-wave pm-wave--l" />
        <span class="pm-wave pm-wave--r" />
      </div>

      <div class="mx-auto max-w-2xl text-center">
        <span class="pm-pill">Get Started</span>
        <h2 class="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
          Ready to make your CI/CD smarter?
        </h2>
        <p class="mx-auto mt-3 max-w-[46ch] text-sm leading-relaxed text-dim">
          Connect a repository and break a build. That is the whole evaluation.
        </p>

        <div class="mt-7 flex justify-center">
          <PmButton variant="primary" size="lg" @click="router.push({ name: 'register' })">
            Get started free <i-lucide-arrow-right class="size-4" />
          </PmButton>
        </div>
        <p class="mt-3 text-[12px] text-mute">No credit card required.</p>
      </div>
    </section>

    <!--
      Back to top. The page is long enough that returning to the nav by scrolling
      is a chore, and the sticky header alone does not solve it.
    -->
    <Transition
      enter-from-class="translate-y-2 opacity-0"
      enter-active-class="transition duration-200"
      leave-to-class="translate-y-2 opacity-0"
      leave-active-class="transition duration-150"
    >
      <button
        v-if="showTop"
        type="button"
        class="pm-totop fixed bottom-6 right-6 z-40 grid size-11 place-items-center rounded-full border bg-surface/90 backdrop-blur"
        aria-label="Back to top"
        @click="toTop"
      >
        <i-lucide-arrow-up class="size-4" />
      </button>
    </Transition>

    <!-- ══ FOOTER ══ -->
    <footer class="border-t px-6 py-12">
      <div class="mx-auto grid max-w-6xl gap-8 sm:grid-cols-2 lg:grid-cols-4">
        <div class="lg:col-span-2">
          <div class="flex items-center gap-2.5">
            <PmLogo class="size-6" />
            <span class="font-semibold">PipeMind</span>
          </div>
          <p class="mt-2 max-w-[42ch] text-[13px] leading-relaxed text-dim">
            Intelligent CI/CD failure analysis. Your pipeline failed — PipeMind
            already knows why.
          </p>
        </div>

        <!-- Every link resolves. A sitemap of dead links reads worse than a
             small honest footer. -->
        <div v-for="column in FOOTER" :key="column.heading">
          <h3 class="text-[12px] font-medium uppercase tracking-wider text-mute">{{ column.heading }}</h3>
          <ul class="mt-3 space-y-2">
            <li v-for="link in column.links" :key="link.label">
              <RouterLink
                v-if="link.to"
                :to="{ name: link.to }"
                class="text-[13px] text-dim transition-colors hover:text-fg"
              >{{ link.label }}</RouterLink>
              <button
                v-else
                type="button"
                class="text-left text-[13px] text-dim transition-colors hover:text-fg"
                @click="scrollTo(link.href!.replace('#', ''))"
              >{{ link.label }}</button>
            </li>
          </ul>
        </div>
      </div>

      <div class="mx-auto mt-10 max-w-6xl border-t pt-6">
        <p class="text-[12px] text-mute">
          © {{ new Date().getFullYear() }} PipeMind. Built as an engineering project.
        </p>
      </div>
    </footer>
  </div>
</template>

<style scoped>
/* ── mockup furniture ───────────────────────────────────────────────── */

/* The lime capsule that labels every section in ui/landingPage.png. */
.pm-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.25rem 0.7rem;
  border-radius: 999px;
  border: 1px solid color-mix(in oklab, var(--pm-accent) 40%, transparent);
  background: color-mix(in oklab, var(--pm-accent) 9%, transparent);
  color: var(--pm-accent);
  font-size: 12px;
  font-weight: 500;
}

/* "Faster" in the headline. A gradient rather than a flat fill so it reads as
   the focal word at 60px without needing a second colour token. */
.pm-gradient-text {
  background: linear-gradient(
    100deg,
    var(--pm-accent),
    color-mix(in oklab, var(--pm-accent) 55%, var(--pm-success)) 55%,
    var(--pm-accent)
  );
  background-size: 200% auto;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  animation: pm-shift 6s ease-in-out infinite;
}

@keyframes pm-shift {
  0%, 100% { background-position: 0% center; }
  50% { background-position: 100% center; }
}

/* ── cards ──────────────────────────────────────────────────────────── */
.pm-feature {
  transition: transform 220ms ease, border-color 220ms ease, box-shadow 220ms ease;
}

.pm-feature:hover {
  transform: translateY(-3px);
  border-color: color-mix(in oklab, var(--pm-accent) 35%, transparent);
  box-shadow: 0 16px 40px -22px color-mix(in oklab, var(--pm-accent) 60%, transparent);
}

.pm-tool {
  transition: transform 200ms ease, border-color 200ms ease;
}

.pm-tool:hover {
  transform: translateY(-2px);
  border-color: color-mix(in oklab, var(--pm-accent) 35%, transparent);
}

/* ── CTA wave art ───────────────────────────────────────────────────── */
/* The mockup has painted ribbons on both flanks. These are conic gradients
   rotating slowly behind a heavy blur — close in feel, and no asset to ship. */
.pm-waves {
  position: absolute;
  inset: 0;
  z-index: -1;
  overflow: hidden;
  pointer-events: none;
}

.pm-wave {
  position: absolute;
  top: 50%;
  width: 30rem;
  height: 30rem;
  border-radius: 50%;
  filter: blur(70px);
  opacity: 0.22;
  background: conic-gradient(
    from 0deg,
    var(--pm-accent),
    var(--pm-ai),
    var(--pm-info),
    var(--pm-accent)
  );
}

.pm-wave--l { left: -14rem; translate: 0 -50%; rotate: -18deg; }
.pm-wave--r { right: -14rem; translate: 0 -50%; rotate: 24deg; }

/* Back-to-top */
.pm-totop {
  transition: transform 160ms ease, border-color 160ms ease, color 160ms ease;
  box-shadow: 0 10px 30px -12px rgb(0 0 0 / 0.5);
}

.pm-totop:hover {
  transform: translateY(-2px);
  border-color: color-mix(in oklab, var(--pm-accent) 45%, transparent);
  color: var(--pm-accent);
}

@media (prefers-reduced-motion: reduce) {
  .pm-gradient-text { animation: none; }

  .pm-totop:hover { transform: none; }

  .pm-feature:hover,
  .pm-tool:hover { transform: none; }

  section {
    transition: none !important;
    opacity: 1 !important;
    transform: none !important;
  }
}
</style>
