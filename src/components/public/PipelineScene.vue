<script setup lang="ts">
/**
 * The isometric pipeline scene from both mockups, built rather than rendered.
 *
 * `ui/landingPage.png` and `ui/login.png` both centre on a 3-D scene: provider
 * cards feeding a glowing core, a red failure branching off, and an AI analysis
 * resolving into a green fix. Commissioning that art would block both pages, so
 * this reconstructs it in CSS and inline SVG — which also themes correctly,
 * stays crisp at any zoom, and costs no bytes to download.
 *
 * Every animation stops under `prefers-reduced-motion`.
 */
withDefaults(defineProps<{
  /** `compact` drops the outer rails for the narrower auth column. */
  variant?: 'full' | 'compact'
}>(), { variant: 'full' })

const PROVIDERS = [
  { icon: 'i-simple-icons-gitlab', label: 'GitLab', delay: '0s' },
  { icon: 'i-simple-icons-github', label: 'GitHub', delay: '0.7s' },
  { icon: 'i-simple-icons-jenkins', label: 'Jenkins', delay: '1.4s' },
]

const CHECKS = ['Root cause', 'Project context', 'Recommended fix']
</script>

<template>
  <div class="pm-scene relative select-none" :class="variant === 'compact' && 'pm-scene--compact'">
    <!-- Ground glow under the core -->
    <div aria-hidden="true" class="pm-ground" />

    <!-- Connector rails. One SVG, dashes marching left to right, so the eye
         follows push → analyse → fix without anything moving position. -->
    <svg
      aria-hidden="true"
      class="pointer-events-none absolute inset-0 size-full"
      viewBox="0 0 400 260"
      fill="none"
      preserveAspectRatio="none"
    >
      <path class="pm-wire pm-wire--in" d="M56 150 C 110 150, 130 128, 186 128" />
      <path class="pm-wire pm-wire--fail" d="M214 118 C 250 100, 258 74, 300 70" />
      <path class="pm-wire pm-wire--fix" d="M214 140 C 250 160, 258 186, 300 190" />
    </svg>

    <!-- Provider chips, drifting on their own offsets -->
    <div class="pm-providers">
      <div
        v-for="provider in PROVIDERS"
        :key="provider.label"
        class="pm-chip pm-float"
        :style="{ animationDelay: provider.delay }"
      >
        <i :class="provider.icon" class="size-4" />
        <span>{{ provider.label }}</span>
      </div>
    </div>

    <!-- The core: PipeMind itself, on a lime platform with expanding rings -->
    <div class="pm-core-wrap">
      <span aria-hidden="true" class="pm-ring" style="animation-delay: 0s" />
      <span aria-hidden="true" class="pm-ring" style="animation-delay: 1.3s" />
      <span aria-hidden="true" class="pm-ring" style="animation-delay: 2.6s" />

      <div class="pm-core">
        <PmLogo class="size-8" />
      </div>
      <div aria-hidden="true" class="pm-platform" />
    </div>

    <!-- Failure card — appears, then hands off to the fix -->
    <div class="pm-card pm-card--fail pm-float" style="animation-delay: 0.4s">
      <div class="flex items-center gap-1.5">
        <i-lucide-circle-x class="size-3.5 shrink-0" :style="{ color: 'var(--pm-danger)' }" />
        <span class="text-[11px] font-semibold">Build failed</span>
      </div>
      <p class="mt-1 font-mono text-[9px] leading-tight opacity-70">
        npm install error<br>exit code 1
      </p>
    </div>

    <!-- AI analysis — the ticks land one after another, on a loop -->
    <div class="pm-card pm-card--ai pm-float" style="animation-delay: 1s">
      <div class="flex items-center gap-1.5">
        <i-lucide-sparkles class="size-3.5 shrink-0 text-accent" />
        <span class="text-[11px] font-semibold">AI analysis</span>
      </div>
      <ul class="mt-1.5 space-y-1">
        <li
          v-for="(check, index) in CHECKS"
          :key="check"
          class="pm-tick flex items-center gap-1.5 text-[9px]"
          :style="{ animationDelay: `${0.6 + index * 0.45}s` }"
        >
          <i-lucide-check class="size-2.5 shrink-0 text-accent" />{{ check }}
        </li>
      </ul>
    </div>

    <!-- Resolution -->
    <div class="pm-card pm-card--fix pm-float" style="animation-delay: 1.6s">
      <div class="flex items-center gap-1.5">
        <i-lucide-circle-check class="size-3.5 shrink-0" :style="{ color: 'var(--pm-accent)' }" />
        <span class="text-[11px] font-semibold">Fix applied</span>
      </div>
      <p class="mt-1 text-[9px] opacity-70">Pipeline recovered</p>
      <div aria-hidden="true" class="pm-progress"><span /></div>
    </div>

    <!-- Push-code card, left rail only -->
    <div v-if="variant === 'full'" class="pm-card pm-card--push pm-float" style="animation-delay: 2.1s">
      <i-lucide-code class="size-4 text-accent" />
      <p class="mt-1 text-[10px] font-medium">Push code</p>
    </div>
  </div>
</template>

<style scoped>
.pm-scene {
  aspect-ratio: 400 / 260;
  width: 100%;
  container-type: inline-size;
}

/* ── ground ─────────────────────────────────────────────────────────── */
.pm-ground {
  position: absolute;
  left: 50%;
  bottom: 14%;
  width: 62%;
  height: 30%;
  transform: translateX(-50%);
  background: radial-gradient(
    ellipse at center,
    color-mix(in oklab, var(--pm-accent) 30%, transparent),
    transparent 68%
  );
  filter: blur(28px);
  opacity: 0.55;
  animation: pm-breathe 5s ease-in-out infinite;
}

/* ── wires ──────────────────────────────────────────────────────────── */
.pm-wire {
  stroke-width: 1.4;
  stroke-linecap: round;
  fill: none;
  stroke-dasharray: 5 7;
  animation: pm-march 1.6s linear infinite;
}

.pm-wire--in { stroke: color-mix(in oklab, var(--pm-accent) 70%, transparent); }
.pm-wire--fail { stroke: color-mix(in oklab, var(--pm-danger) 70%, transparent); }
.pm-wire--fix { stroke: color-mix(in oklab, var(--pm-accent) 85%, transparent); }

@keyframes pm-march {
  to { stroke-dashoffset: -24; }
}

/* ── provider chips ─────────────────────────────────────────────────── */
.pm-providers {
  position: absolute;
  left: 4%;
  top: 8%;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.pm-chip {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.3rem 0.6rem;
  border-radius: 8px;
  border: 1px solid var(--pm-border, rgb(255 255 255 / 0.09));
  background: color-mix(in oklab, var(--pm-surface) 85%, transparent);
  backdrop-filter: blur(6px);
  font-size: 10px;
  font-weight: 500;
  white-space: nowrap;
}

/* ── the core ───────────────────────────────────────────────────────── */
.pm-core-wrap {
  position: absolute;
  left: 50%;
  top: 46%;
  translate: -50% -50%;
  display: grid;
  place-items: center;
}

.pm-core {
  position: relative;
  z-index: 2;
  display: grid;
  place-items: center;
  width: 4.5rem;
  height: 4.5rem;
  border-radius: 16px;
  border: 1px solid color-mix(in oklab, var(--pm-accent) 35%, transparent);
  background: linear-gradient(155deg,
    color-mix(in oklab, var(--pm-surface-2) 92%, transparent),
    color-mix(in oklab, var(--pm-bg) 92%, transparent));
  box-shadow:
    0 0 0 1px color-mix(in oklab, var(--pm-accent) 12%, transparent),
    0 14px 40px -12px color-mix(in oklab, var(--pm-accent) 45%, transparent);
  animation: pm-hover 4.5s ease-in-out infinite;
}

/* The lime slab the core sits on — what reads as "isometric" in the mockup. */
.pm-platform {
  position: absolute;
  bottom: -1.1rem;
  width: 7rem;
  height: 1.6rem;
  border-radius: 50%;
  background: radial-gradient(ellipse at center,
    color-mix(in oklab, var(--pm-accent) 55%, transparent),
    transparent 70%);
  filter: blur(5px);
  animation: pm-breathe 4.5s ease-in-out infinite;
}

.pm-ring {
  position: absolute;
  width: 4.5rem;
  height: 4.5rem;
  border-radius: 50%;
  border: 1px solid color-mix(in oklab, var(--pm-accent) 45%, transparent);
  animation: pm-ripple 3.9s ease-out infinite;
}

@keyframes pm-ripple {
  0% { transform: scale(1); opacity: 0.7; }
  100% { transform: scale(2.9); opacity: 0; }
}

/* ── floating cards ─────────────────────────────────────────────────── */
.pm-card {
  position: absolute;
  border-radius: 10px;
  border: 1px solid var(--pm-border, rgb(255 255 255 / 0.09));
  background: color-mix(in oklab, var(--pm-surface) 92%, transparent);
  backdrop-filter: blur(8px);
  padding: 0.5rem 0.6rem;
  min-width: 7.2rem;
}

.pm-card--fail {
  right: 3%;
  top: 12%;
  border-color: color-mix(in oklab, var(--pm-danger) 40%, transparent);
  box-shadow: 0 8px 30px -10px color-mix(in oklab, var(--pm-danger) 40%, transparent);
}

.pm-card--ai {
  right: 20%;
  bottom: 16%;
  border-color: color-mix(in oklab, var(--pm-accent) 30%, transparent);
}

.pm-card--fix {
  right: 2%;
  bottom: 6%;
  border-color: color-mix(in oklab, var(--pm-accent) 45%, transparent);
  box-shadow: 0 8px 30px -10px color-mix(in oklab, var(--pm-accent) 45%, transparent);
}

.pm-card--push {
  left: 3%;
  bottom: 14%;
  min-width: 5rem;
}

.pm-progress {
  margin-top: 0.35rem;
  height: 3px;
  border-radius: 3px;
  background: color-mix(in oklab, var(--pm-accent) 18%, transparent);
  overflow: hidden;
}

.pm-progress span {
  display: block;
  height: 100%;
  border-radius: 3px;
  background: var(--pm-accent);
  animation: pm-fill 3.4s ease-in-out infinite;
}

@keyframes pm-fill {
  0%, 12% { width: 0; }
  55%, 100% { width: 100%; }
}

/* Ticks land one by one, then the loop restarts — the analysis "thinking". */
.pm-tick {
  opacity: 0;
  animation: pm-land 3.4s ease-out infinite;
}

@keyframes pm-land {
  0%, 8% { opacity: 0; transform: translateX(-3px); }
  22%, 88% { opacity: 1; transform: none; }
  100% { opacity: 0; }
}

/* ── shared motion ──────────────────────────────────────────────────── */
.pm-float { animation: pm-hover 5.5s ease-in-out infinite; }

@keyframes pm-hover {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-7px); }
}

@keyframes pm-breathe {
  0%, 100% { opacity: 0.45; transform: translateX(-50%) scale(1); }
  50% { opacity: 0.75; transform: translateX(-50%) scale(1.06); }
}

.pm-platform { animation-name: pm-breathe-plain; }

@keyframes pm-breathe-plain {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}

/* Narrower column: pull the outer cards in so nothing clips. */
.pm-scene--compact .pm-card--fail { right: 0; top: 8%; }
.pm-scene--compact .pm-card--fix { right: 0; bottom: 4%; }
.pm-scene--compact .pm-card--ai { right: 24%; bottom: 20%; }

@container (max-width: 380px) {
  .pm-card { min-width: 5.6rem; padding: 0.4rem 0.45rem; }
  .pm-providers { gap: 0.25rem; }
}

/* Nothing here is load-bearing, so all of it stops on request. */
@media (prefers-reduced-motion: reduce) {
  .pm-scene *,
  .pm-scene *::before,
  .pm-scene *::after {
    animation: none !important;
  }

  .pm-tick { opacity: 1; }
  .pm-progress span { width: 100%; }
}
</style>
