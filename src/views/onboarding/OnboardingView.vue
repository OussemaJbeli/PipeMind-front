<script setup lang="ts">
import { useQueryClient } from '@tanstack/vue-query'
import { useRouter } from 'vue-router'

import { api } from '@/api/client'
import { useAuthForm } from '@/composables/useAuthForm'
import { useAuthStore } from '@/stores/auth'
import { useIntegrations } from '@/api/queries/integrations'
import { useWorkspaceProjects } from '@/api/queries/workspace'

const auth = useAuthStore()
const router = useRouter()
const client = useQueryClient()
const { errors, generalError, loading, submit } = useAuthForm()

type Step = 'workspace' | 'connect' | 'ai' | 'waiting'

const { data: integrations, refetch: refetchIntegrations } = useIntegrations()
const { data: projects, refetch: refetchProjects } = useWorkspaceProjects()

/**
 * Resume position is DERIVED, not stored.
 *
 * A saved step number desynchronises the moment anything changes outside the
 * wizard — an integration deleted, a project imported from the settings page —
 * and the user resumes on a step that no longer makes sense. Reading the real
 * state cannot drift, and needs no extra column.
 */
const resolved = ref(false)
const step = ref<Step>('workspace')

watchEffect(() => {
  if (resolved.value || !integrations.value || !projects.value)
    return

  const connected = integrations.value.some(i => i.status === 'active')

  if (projects.value.length)
    step.value = 'ai'
  else if (connected)
    step.value = 'connect'
  else if (workspace.name)
    step.value = 'connect'

  resolved.value = true
})

/* ── step 1: workspace ─────────────────────────────────────────────── */

const workspace = reactive({
  name: auth.currentTeam?.name ?? '',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
})

function saveWorkspace() {
  submit(async () => {
    await api.put('/workspace/settings', workspace)
    await auth.fetchUser()
    step.value = 'connect'
  })
}

/* ── step 4: AI provider ───────────────────────────────────────────── */

const ai = reactive({ provider: 'gemini', api_key: '', model: '' })
const aiTest = ref<{ ok: boolean, message: string } | null>(null)
const testing = ref(false)

const MODELS: Record<string, string> = {
  gemini: 'gemini-3.6-flash',
  ollama: 'qwen2.5-coder:7b',
}

async function testAi() {
  testing.value = true
  aiTest.value = null

  try {
    const { data } = await api.post<{ data: { ok: boolean, message: string } }>(
      '/ai-providers/test',
      { provider: ai.provider, api_key: ai.api_key || undefined, model: ai.model || MODELS[ai.provider] },
    )
    aiTest.value = data.data
  }
  catch (thrown) {
    aiTest.value = { ok: false, message: (thrown as { message?: string }).message ?? 'Could not reach the provider.' }
  }
  finally {
    testing.value = false
  }
}

function saveAi() {
  submit(async () => {
    await api.post('/ai-providers', {
      name: ai.provider === 'gemini' ? 'Gemini' : 'Ollama (local)',
      provider: ai.provider,
      model: ai.model || MODELS[ai.provider],
      api_key: ai.api_key || undefined,
      is_default: true,
      is_local: ai.provider === 'ollama',
    })
    step.value = 'waiting'
  })
}

/* ── finishing ─────────────────────────────────────────────────────── */

async function finish(slug?: string) {
  await auth.completeOnboarding()
  client.invalidateQueries()
  router.push(slug ? { name: 'project.overview', params: { slug } } : { name: 'workspace' })
}

async function onConnected() {
  await Promise.all([refetchIntegrations(), refetchProjects()])
  step.value = 'ai'
}

const STEPS: { key: Step, label: string }[] = [
  { key: 'workspace', label: 'Workspace' },
  { key: 'connect', label: 'Connect CI' },
  { key: 'ai', label: 'AI provider' },
  { key: 'waiting', label: 'First pipeline' },
]

const index = computed(() => STEPS.findIndex(s => s.key === step.value))
</script>

<template>
  <div class="mx-auto max-w-3xl px-6 py-10">
    <div class="mb-8 flex items-center gap-2.5">
      <PmLogo class="size-8" />
      <span class="text-lg font-semibold">PipeMind</span>
      <PmButton variant="ghost" size="sm" class="ml-auto" @click="finish()">
        Skip setup
      </PmButton>
    </div>

    <!-- Progress, with the goal named. "First pipeline" as the final step says
         what success actually is: a real failure on the board, not an account. -->
    <ol class="mb-9 flex items-center gap-2">
      <li v-for="(s, i) in STEPS" :key="s.key" class="flex flex-1 items-center gap-2">
        <span
          class="grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-semibold transition-colors"
          :class="i < index
            ? 'bg-accent text-[var(--pm-on-accent)]'
            : i === index ? 'border border-[color:var(--pm-accent)] text-accent' : 'border text-mute'"
        >
          <i v-if="i < index" class="i-lucide-check size-3" />
          <template v-else>{{ i + 1 }}</template>
        </span>
        <span class="hidden text-[12px] sm:block" :class="i <= index ? 'text-fg' : 'text-mute'">
          {{ s.label }}
        </span>
        <span v-if="i < STEPS.length - 1" class="h-px flex-1" :class="i < index ? 'bg-accent' : 'bg-[var(--pm-surface-3)]'" />
      </li>
    </ol>

    <PmAlert v-if="generalError" tone="danger" class="mb-5">
      {{ generalError }}
    </PmAlert>

    <!-- Step 1 -->
    <PmCard v-if="step === 'workspace'" title="Name your workspace" subtitle="You can change this later.">
      <form class="space-y-4" @submit.prevent="saveWorkspace">
        <AuthField
          v-model="workspace.name"
          label="Workspace name"
          placeholder="OJ Team"
          autofocus
          :errors="errors.name"
        />
        <AuthField
          v-model="workspace.timezone"
          label="Timezone"
          hint="Used for daily rollups and the failure heatmap."
          :errors="errors.timezone"
        />
        <PmButton type="submit" variant="primary" :loading="loading">
          Continue
        </PmButton>
      </form>
    </PmCard>

    <!--
      Steps 2 and 3 are exactly what the integration wizard already does:
      provider → credentials → verify → pick repos → register webhooks. Wrapping
      it means one implementation to fix when a provider changes its API.
    -->
    <template v-else-if="step === 'connect'">
      <IntegrationWizard @done="onConnected" @cancel="step = 'workspace'" />
    </template>

    <!-- Step 4 -->
    <PmCard v-else-if="step === 'ai'" title="Choose an AI provider" subtitle="Skip this and PipeMind still classifies failures with rules.">
      <div class="space-y-5">
        <PmSegmented
          v-model="ai.provider"
          :options="[
            { key: 'gemini', label: 'Gemini (cloud)' },
            { key: 'ollama', label: 'Ollama (local)' },
          ]"
        />

        <AuthField
          v-if="ai.provider === 'gemini'"
          v-model="ai.api_key"
          label="API key"
          type="password"
          placeholder="AQ.Ab8… or AIza…"
          hint="From aistudio.google.com/apikey. One key reaches every Gemini model."
          :errors="errors.api_key"
        />

        <!-- Named because it is the difference between logs leaving your
             infrastructure and not. -->
        <PmAlert v-else tone="info">
          Nothing leaves your machine with Ollama. PipeMind will look for it at
          <span class="font-mono">localhost:11434</span>.
        </PmAlert>

        <div class="flex flex-wrap items-center gap-3">
          <PmButton variant="secondary" size="sm" :loading="testing" @click="testAi">
            Test connection
          </PmButton>

          <p v-if="aiTest" class="flex items-start gap-1.5 text-xs" :class="aiTest.ok ? 'text-accent' : 'text-[var(--pm-warning)]'">
            <i :class="aiTest.ok ? 'i-lucide-check' : 'i-lucide-triangle-alert'" class="mt-0.5 size-3.5 shrink-0" />
            {{ aiTest.message }}
          </p>
        </div>

        <div class="flex flex-wrap gap-2 border-t pt-4">
          <!-- Saving is gated on a passing test: a provider stored untested
               fails on the first real analysis, an hour later, in a queue. -->
          <PmButton variant="primary" :disabled="!aiTest?.ok" :loading="loading" @click="saveAi">
            Save and continue
          </PmButton>
          <PmButton variant="ghost" @click="step = 'waiting'">
            Skip for now
          </PmButton>
        </div>
      </div>
    </PmCard>

    <!-- Waiting room -->
    <OnboardingWaitingRoom
      v-else
      :projects="projects ?? []"
      @arrived="finish"
      @skip="finish()"
    />
  </div>
</template>
