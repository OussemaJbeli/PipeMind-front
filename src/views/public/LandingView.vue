<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()

const PROBLEMS = [
  { stat: '48,000', label: 'log lines', line: 'The error is on one of them.' },
  { stat: '12', label: 'possible causes', line: 'Only one of them is real.' },
  { stat: '"we fixed', label: 'this in March"', line: 'Nobody remembers how.' },
]

const STEPS = [
  { title: 'Connect', line: 'GitLab, GitHub Actions, Jenkins or any webhook. One token, one minute.' },
  { title: 'Observe', line: 'Every pipeline, job and log — normalised into one shape.' },
  { title: 'Analyse', line: 'Secrets redacted, cause found, evidence cited. Not a summary of the log.' },
  { title: 'Remember', line: 'The next identical failure answers itself, for free.' },
]

const FEATURES = [
  { icon: 'i-lucide-crosshair', title: 'Root cause, cited', line: 'Every claim links to a log line, a changed file, or a past failure.' },
  { icon: 'i-lucide-history', title: 'Historical memory', line: 'Confirm a fix once and the same error never needs a model again.' },
  { icon: 'i-lucide-activity', title: 'Anomaly detection', line: 'A job 4× slower than its own baseline, caught before anyone notices.' },
  { icon: 'i-lucide-git-branch', title: 'Multi-platform', line: 'One board across every provider you run.' },
  { icon: 'i-lucide-file-diff', title: 'Real patches', line: 'Where the fix is certain, you get a diff — not "check the recent changes".' },
  { icon: 'i-lucide-shield', title: 'Privacy modes', line: 'Redacted cloud, or local models where nothing leaves your infrastructure.' },
]

onMounted(() => {
  document.title = 'PipeMind — your pipeline failed. PipeMind already knows why.'
})
</script>

<template>
  <div class="min-h-screen bg-[var(--pm-bg)]">
    <header class="sticky top-0 z-30 border-b bg-[color:var(--pm-bg)]/85 backdrop-blur">
      <nav class="mx-auto flex max-w-6xl items-center gap-6 px-6 py-3.5">
        <RouterLink to="/" class="flex items-center gap-2.5">
          <PmLogo class="size-7" />
          <span class="font-semibold">PipeMind</span>
        </RouterLink>

        <div class="ml-auto flex items-center gap-2">
          <template v-if="auth.isAuthenticated">
            <PmButton variant="primary" size="sm" @click="$router.push({ name: 'workspace' })">
              Open workspace
            </PmButton>
          </template>
          <template v-else>
            <RouterLink :to="{ name: 'login' }" class="px-3 text-[13px] font-medium text-dim hover:text-fg">
              Sign in
            </RouterLink>
            <PmButton variant="primary" size="sm" @click="$router.push({ name: 'register' })">
              Get started
            </PmButton>
          </template>
        </div>
      </nav>
    </header>

    <!-- HERO -->
    <section class="mx-auto max-w-6xl px-6 pb-16 pt-16 sm:pt-24">
      <div class="grid items-center gap-12 lg:grid-cols-2">
        <div>
          <h1 class="text-4xl font-semibold leading-[1.1] sm:text-5xl">
            Your pipeline failed.<br>
            <span class="text-accent">PipeMind already knows why.</span>
          </h1>

          <p class="mt-5 max-w-lg text-[15px] leading-relaxed text-dim">
            An intelligence layer over GitLab, GitHub Actions and Jenkins.
            It reads the logs, finds the cause, and remembers the fix.
          </p>

          <div class="mt-8 flex flex-wrap gap-3">
            <PmButton variant="primary" size="lg" @click="$router.push({ name: 'register' })">
              Get started free
            </PmButton>
            <PmButton variant="outline" size="lg" @click="$router.push({ name: 'login' })">
              Sign in
            </PmButton>
          </div>

          <p class="mt-4 text-xs text-mute">
            Self-hosted. Your logs stay redacted, or never leave at all.
          </p>
        </div>

        <HeroDemo />
      </div>
    </section>

    <!-- THE PROBLEM -->
    <section class="border-y bg-[var(--pm-surface)]">
      <div class="mx-auto grid max-w-6xl gap-8 px-6 py-14 sm:grid-cols-3">
        <div v-for="problem in PROBLEMS" :key="problem.label">
          <p class="text-2xl font-semibold">
            {{ problem.stat }}
            <span class="text-base font-normal text-dim">{{ problem.label }}</span>
          </p>
          <p class="mt-1.5 text-sm text-mute">
            {{ problem.line }}
          </p>
        </div>
      </div>
    </section>

    <!-- HOW IT WORKS -->
    <section class="mx-auto max-w-6xl px-6 py-16">
      <h2 class="text-2xl font-semibold">
        How it works
      </h2>

      <ol class="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <li v-for="(s, i) in STEPS" :key="s.title" class="relative">
          <span class="grid size-8 place-items-center rounded-full border border-[color:var(--pm-accent)]/40 text-[13px] font-semibold text-accent">
            {{ i + 1 }}
          </span>
          <h3 class="mt-3 font-medium">
            {{ s.title }}
          </h3>
          <p class="mt-1.5 text-sm leading-relaxed text-dim">
            {{ s.line }}
          </p>
        </li>
      </ol>
    </section>

    <!-- FEATURES -->
    <section class="border-t bg-[var(--pm-surface)]">
      <div class="mx-auto max-w-6xl px-6 py-16">
        <h2 class="text-2xl font-semibold">
          What it actually does
        </h2>

        <div class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <PmCard v-for="feature in FEATURES" :key="feature.title">
            <i :class="feature.icon" class="size-5 text-accent" />
            <h3 class="mt-3 font-medium">
              {{ feature.title }}
            </h3>
            <p class="mt-1.5 text-sm leading-relaxed text-dim">
              {{ feature.line }}
            </p>
          </PmCard>
        </div>
      </div>
    </section>

    <!-- PRIVACY -->
    <section class="mx-auto max-w-6xl px-6 py-16">
      <h2 class="text-2xl font-semibold">
        Your logs, your choice
      </h2>
      <p class="mt-2 max-w-2xl text-sm text-dim">
        Logs contain credentials, tokens and customer data. PipeMind redacts before
        anything is stored or sent — and if that is not enough, it never sends at all.
      </p>

      <div class="mt-8 grid gap-4 lg:grid-cols-2">
        <PmCard title="Cloud, redacted" subtitle="Gemini or any OpenAI-compatible model">
          <ul class="space-y-2 text-sm text-dim">
            <li class="flex gap-2"><i-lucide-check class="mt-0.5 size-4 shrink-0 text-accent" />24 redaction rules run before a byte leaves</li>
            <li class="flex gap-2"><i-lucide-check class="mt-0.5 size-4 shrink-0 text-accent" />Raw logs stay in your own object storage</li>
            <li class="flex gap-2"><i-lucide-check class="mt-0.5 size-4 shrink-0 text-accent" />Per-workspace spend ceiling, enforced before each call</li>
          </ul>
        </PmCard>

        <PmCard title="Local only" subtitle="Ollama on your own hardware">
          <ul class="space-y-2 text-sm text-dim">
            <li class="flex gap-2"><i-lucide-check class="mt-0.5 size-4 shrink-0 text-accent" />Nothing reaches a third party, ever</li>
            <li class="flex gap-2"><i-lucide-check class="mt-0.5 size-4 shrink-0 text-accent" />Enforced server-side, not by a checkbox</li>
            <li class="flex gap-2"><i-lucide-check class="mt-0.5 size-4 shrink-0 text-accent" />Analysis fails loudly rather than falling back to the cloud</li>
          </ul>
        </PmCard>
      </div>
    </section>

    <!-- CTA -->
    <section class="border-t bg-[var(--pm-surface)]">
      <div class="mx-auto max-w-2xl px-6 py-20 text-center">
        <h2 class="text-3xl font-semibold">
          Stop reading logs.
        </h2>
        <p class="mt-3 text-[15px] text-dim">
          Connect a repository and the next failure explains itself.
        </p>
        <PmButton variant="primary" size="lg" class="mt-8" @click="$router.push({ name: 'register' })">
          Get started free
        </PmButton>
      </div>
    </section>

    <footer class="border-t">
      <div class="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-6 py-8 text-xs text-mute">
        <span class="flex items-center gap-2">
          <PmLogo class="size-5" />PipeMind
        </span>
        <span class="ml-auto">Built by OJ Team</span>
      </div>
    </footer>
  </div>
</template>
