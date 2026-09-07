<script setup lang="ts">
import { usePreferredReducedMotion } from '@vueuse/core'

import type { Analysis } from '@/types/api'

/**
 * The pitch, shown rather than described.
 *
 * Phase 4 renders the product's real `AnalysisPanel` with static data — not a
 * mock of it. A hand-drawn imitation would drift from the real component the
 * first time either changed, and the landing page would start advertising
 * something the product no longer does.
 */
const motion = usePreferredReducedMotion()

const TYPED = 'git push origin feature/payment'
const typed = ref('')
const phase = ref(0)

const JOBS = [
  { name: 'checkout', status: 'success', at: 900 },
  { name: 'npm-ci', status: 'success', at: 1300 },
  { name: 'lint', status: 'success', at: 1700 },
  { name: 'backend-tests', status: 'failed', at: 2200 },
]

const shown = ref<typeof JOBS>([])
let timers: ReturnType<typeof setTimeout>[] = []

function run() {
  clear()
  typed.value = ''
  shown.value = []
  phase.value = 1

  TYPED.split('').forEach((char, i) => {
    timers.push(setTimeout(() => (typed.value += char), 40 * i))
  })

  const typingDone = 40 * TYPED.length + 200

  JOBS.forEach((job) => {
    timers.push(setTimeout(() => shown.value.push(job), typingDone + job.at))
  })

  timers.push(setTimeout(() => (phase.value = 3), typingDone + 2600))
  timers.push(setTimeout(() => (phase.value = 4), typingDone + 4200))
  timers.push(setTimeout(run, typingDone + 16000))
}

function clear() {
  timers.forEach(clearTimeout)
  timers = []
}

onMounted(() => {
  // Reduced motion goes straight to the result: the animation is the pitch, but
  // for someone who has asked for stillness the ANSWER is the pitch.
  if (motion.value === 'reduce') {
    typed.value = TYPED
    shown.value = JOBS
    phase.value = 4

    return
  }

  run()
})

onUnmounted(clear)

const DEMO: Analysis = {
  uuid: 'demo',
  status: 'completed',
  error: null,
  confidence: 0.92,
  summary: 'Database was unavailable when integration tests started.',
  root_cause: 'The database container had not finished its startup sequence before the test job '
    + 'began connecting. docker-compose.yml was modified in this commit and the healthcheck-based '
    + 'depends_on condition was removed.',
  explanation: null,
  is_transient: false,
  retry_recommended: false,
  classification_source: 'hybrid',
  classification_confidence: 0.94,
  used_rag: true,
  similar_failures_count: 3,
  model_provider: 'gemini',
  model_name: 'gemini-3.6-flash',
  latency_ms: 3820,
  cost_usd: 0.000412,
  cache_hit: false,
  completed_at: new Date().toISOString(),
  evidence: [
    {
      type: 'log_line',
      content: 'SQLSTATE[HY000] [2002] Connection refused',
      source_ref: 'job_logs#L1294',
      line_number: 1294,
      weight: 0.95,
    },
    {
      type: 'changed_file',
      content: 'docker-compose.yml — depends_on condition removed',
      source_ref: 'docker-compose.yml',
      line_number: null,
      weight: 0.88,
    },
    {
      type: 'historical_failure',
      content: 'Failure #921 had the same signature — fixed by adding a healthcheck',
      source_ref: 'failure:921',
      line_number: null,
      weight: 0.81,
    },
  ],
  feedback: { given: false, was_helpful: null },
}
</script>

<template>
  <div class="overflow-hidden rounded-[var(--pm-radius-lg)] border bg-[var(--pm-surface-2)] shadow-[0_24px_60px_-30px_rgba(0,0,0,0.5)]">
    <div class="flex items-center gap-1.5 border-b px-4 py-2.5">
      <span v-for="dot in 3" :key="dot" class="size-2.5 rounded-full bg-[var(--pm-surface-3)]" />
      <span class="ml-2 text-[11px] text-mute">feature/payment</span>
    </div>

    <div class="space-y-2.5 p-4 font-mono text-[12px]">
      <p class="text-dim">
        <span class="text-accent">$</span> {{ typed }}<span
          v-if="phase === 1 && typed.length < TYPED.length"
          class="ml-0.5 inline-block h-3.5 w-1.5 animate-pulse bg-accent align-middle"
        />
      </p>

      <p v-if="shown.length" class="text-[var(--pm-danger)]">
        ✗ Pipeline #821 failed · test · 2m 14s
      </p>

      <ul class="space-y-1">
        <li
          v-for="job in shown"
          :key="job.name"
          class="flex items-center gap-2"
          :class="job.status === 'failed' ? 'text-[var(--pm-danger)]' : 'text-dim'"
        >
          <i :class="job.status === 'failed' ? 'i-lucide-x' : 'i-lucide-check'" class="size-3" />
          {{ job.name }}
        </li>
      </ul>

      <p v-if="phase === 3" class="flex items-center gap-2 text-accent">
        <i-lucide-loader-circle class="size-3.5 animate-spin" />
        PipeMind is analysing…
      </p>
    </div>

    <Transition
      enter-active-class="transition-all duration-500"
      enter-from-class="opacity-0 translate-y-2"
    >
      <div v-if="phase >= 4" class="border-t p-4">
        <AnalysisPanel :analysis="DEMO" status="analyzed" />
      </div>
    </Transition>
  </div>
</template>
