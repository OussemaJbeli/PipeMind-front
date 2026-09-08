<script setup lang="ts">
/*
 * Mirrored from v1: showcase left, form right.
 *
 * The left panel now carries real content — headline, copy, feature chips — so
 * it can no longer be `aria-hidden` wholesale. Only the artwork is hidden; the
 * words are meaningful and belong in the reading order.
 */

// Four across, as in ui/login.png — each a lime glyph with a two-line label.
const CHIPS = [
  { icon: 'i-lucide-crosshair', top: 'Detect', bottom: 'failures early' },
  { icon: 'i-lucide-brain', top: 'Analyse', bottom: 'with AI' },
  { icon: 'i-lucide-lightbulb', top: 'Recommend', bottom: 'fixes & actions' },
  { icon: 'i-lucide-zap', top: 'Keep', bottom: 'your flow' },
]

// Integration targets, not customers. "Trusted by" over these logos would read
// as endorsement from companies that have never heard of this project.
const WORKS_WITH = [
  { icon: 'i-simple-icons-gitlab', label: 'GitLab' },
  { icon: 'i-simple-icons-github', label: 'GitHub' },
  { icon: 'i-simple-icons-jenkins', label: 'Jenkins' },
  { icon: 'i-simple-icons-amazonwebservices', label: 'AWS' },
  { icon: 'i-simple-icons-docker', label: 'Docker' },
  { icon: 'i-simple-icons-googlecloud', label: 'Google Cloud' },
]
</script>

<template>
  <div class="grid min-h-screen bg-bg text-fg lg:grid-cols-[1fr_minmax(0,520px)]">
    <!-- Showcase. Dropped entirely below lg: the form is what the user came for. -->
    <aside class="relative hidden flex-col justify-center overflow-hidden border-r bg-sidebar px-12 py-12 lg:flex">
      <div
        aria-hidden="true"
        class="absolute inset-0 opacity-[0.04]"
        style="background-image: radial-gradient(var(--pm-accent) 1px, transparent 1px); background-size: 22px 22px;"
      />
      <div
        aria-hidden="true"
        class="pointer-events-none absolute -left-32 top-1/3 size-[460px] rounded-full opacity-[0.10] blur-[110px]"
        :style="{ background: 'radial-gradient(circle, var(--pm-accent), transparent 70%)' }"
      />

      <div class="relative w-full max-w-[720px]">
        <slot name="showcase">
          <div class="flex items-center gap-3">
            <PmLogo class="size-9" />
            <span class="text-xl font-semibold">PipeMind</span>
          </div>

          <p class="mt-10 text-[11px] font-medium uppercase tracking-[0.18em] text-mute">
            Intelligent CI/CD Failure Analysis Platform
          </p>

          <h1 class="mt-3 text-4xl font-bold leading-[1.08] tracking-tight xl:text-5xl">
            From Failure<br>to Fix, <span class="text-accent">Faster.</span>
          </h1>

          <!-- Same copy as the landing hero on purpose: the two pages should
               reinforce each other rather than paraphrase. -->
          <p class="mt-4 max-w-[46ch] text-sm leading-relaxed text-dim">
            PipeMind monitors your CI/CD pipelines, analyses failures, understands
            your project context and gives you actionable solutions — so you can
            focus on building, not debugging.
          </p>

          <ul class="mt-7 flex flex-wrap gap-x-7 gap-y-4">
            <li v-for="chip in CHIPS" :key="chip.top" class="flex items-center gap-2.5">
              <span
                class="grid size-7 shrink-0 place-items-center rounded-full"
                :style="{ background: 'color-mix(in oklab, var(--pm-accent) 13%, transparent)' }"
              >
                <i :class="chip.icon" class="size-3.5 text-accent" />
              </span>
              <span class="text-[12px] leading-tight">
                <span class="block font-medium">{{ chip.top }}</span>
                <span class="block text-mute">{{ chip.bottom }}</span>
              </span>
            </li>
          </ul>

          <!-- The isometric scene from the mockup, built rather than rendered. -->
          <div class="mt-8 max-w-[620px]">
            <PipelineScene variant="compact" />
          </div>

          <!--
            The mockup titles this "Trusted by DevOps teams worldwide" over the
            same logos. They are integration targets, not customers — under
            "Trusted by" that reads as endorsement from companies who have never
            heard of this project. "Works with" is true at no visual cost.
          -->
          <div class="mt-8">
            <p class="text-[11px] text-mute">Works with the tools you already run</p>
            <div class="mt-3 flex flex-wrap items-center gap-6">
              <span
                v-for="tool in WORKS_WITH"
                :key="tool.label"
                class="flex items-center gap-1.5 text-[11px] text-mute opacity-60 transition-opacity hover:opacity-100"
              >
                <i :class="tool.icon" class="size-4" />{{ tool.label }}
              </span>
            </div>
          </div>
        </slot>
      </div>
    </aside>

    <!-- Form column. The card floats and centres; on mobile it becomes the page. -->
    <main class="flex items-center justify-center px-6 py-10 sm:px-10">
      <div class="w-full max-w-[420px]">
        <div class="mb-7 flex items-center gap-2.5 lg:hidden">
          <PmLogo class="size-8" />
          <span class="text-lg font-semibold">PipeMind</span>
        </div>

        <div class="pm-auth-card rounded-2xl border bg-surface p-6 sm:p-8">
          <slot />
        </div>

        <!--
          Defensible as written: passwords are bcrypt-hashed, provider tokens and
          AI keys use the encrypted cast, and keys are hidden from every
          response. It is only true end-to-end over HTTPS, which is why it says
          "in transit and at rest" rather than naming a standard.
        -->
        <div class="mt-5 flex items-start gap-2.5 px-1">
          <i-lucide-shield-check class="mt-0.5 size-4 shrink-0 text-accent" />
          <p class="text-[12px] leading-relaxed text-mute">
            <span class="font-medium text-dim">Your data is protected.</span>
            Credentials are hashed, and provider tokens and API keys are encrypted
            at rest — they are never returned by the API.
          </p>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.pm-auth-card {
  box-shadow: 0 30px 70px -35px rgb(0 0 0 / 0.7);
}
</style>
