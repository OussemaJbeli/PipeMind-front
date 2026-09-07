<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'

import type { ApiError } from '@/api/client'
import {
  useCreateIntegration, useImportRepositories, useRemoteRepositories,
  useTestConnection, useWebhookSettings,
} from '@/api/queries/integrations'
import type { ConnectionIdentity, ImportResult } from '@/types/api'
import type { ProviderType } from '@/types/domain'
import { providerSpec } from './providerCatalog'

const emit = defineEmits<{ done: [], cancel: [] }>()

const step = ref(1)
const TOTAL = 4

const form = reactive({
  provider: null as ProviderType | null,
  instance: 'cloud' as 'cloud' | 'self_hosted',
  baseUrl: '',
  token: '',
  username: '',
  name: '',
})

const spec = computed(() => (form.provider ? providerSpec(form.provider) : null))
const identity = ref<ConnectionIdentity | null>(null)
const createdUuid = ref<string | null>(null)
const search = ref('')
const selected = ref<Set<string>>(new Set())
const importResults = ref<ImportResult[] | null>(null)
const error = ref<string | null>(null)

const { data: webhookSettings } = useWebhookSettings()
const testConnection = useTestConnection()
const createIntegration = useCreateIntegration()
const { data: repositories, isLoading: loadingRepos } = useRemoteRepositories(createdUuid, search)
const importRepositories = useImportRepositories(createdUuid)

// Jenkins and the generic webhook have no cloud option; skip the choice entirely.
watch(() => form.provider, (provider) => {
  identity.value = null
  error.value = null

  if (!provider)
    return

  const s = providerSpec(provider)
  form.instance = s.cloud ? 'cloud' : 'self_hosted'
  form.baseUrl = s.cloud?.baseUrl ?? ''
  form.name = s.label
})

const canAdvance = computed(() => {
  switch (step.value) {
    case 1: return Boolean(form.provider)
    case 2: return form.instance === 'cloud' || Boolean(form.baseUrl.trim())
    // Step 3 only advances once the connection has been proven to work.
    case 3: return Boolean(createdUuid.value)
    // Reachability is a hard gate: providers reject loopback webhook URLs.
    case 4: return selected.value.size > 0 && (webhookSettings.value?.reachable ?? false)
    default: return false
  }
})

async function runTest() {
  error.value = null
  identity.value = null

  try {
    identity.value = await testConnection.mutateAsync({
      provider: form.provider!,
      base_url: form.instance === 'self_hosted' ? form.baseUrl.trim() : spec.value?.cloud?.baseUrl,
      token: form.token.trim(),
      username: form.username.trim() || undefined,
    })
  }
  catch (e) {
    error.value = (e as ApiError).message
  }
}

async function saveAndContinue() {
  error.value = null

  try {
    const integration = await createIntegration.mutateAsync({
      provider: form.provider!,
      name: form.name.trim() || spec.value!.label,
      base_url: form.instance === 'self_hosted' ? form.baseUrl.trim() : spec.value?.cloud?.baseUrl,
      token: form.token.trim(),
      username: form.username.trim() || undefined,
    })

    createdUuid.value = integration.uuid
    step.value = 4
  }
  catch (e) {
    error.value = (e as ApiError).message
  }
}

function toggle(externalId: string) {
  const next = new Set(selected.value)
  next.has(externalId) ? next.delete(externalId) : next.add(externalId)
  selected.value = next
}

async function runImport() {
  error.value = null

  try {
    const result = await importRepositories.mutateAsync([...selected.value])
    importResults.value = result.data
    step.value = 5
  }
  catch (e) {
    error.value = (e as ApiError).message
  }
}
</script>

<template>
  <div class="mx-auto max-w-3xl">
    <!-- progress -->
    <ol class="mb-8 flex items-center gap-2" aria-label="Setup progress">
      <li v-for="n in TOTAL" :key="n" class="flex flex-1 items-center gap-2">
        <span
          class="grid size-7 shrink-0 place-items-center rounded-full text-[11px] font-semibold transition-colors"
          :class="step > n
            ? 'bg-accent text-[var(--pm-on-accent)]'
            : step === n
              ? 'border-2 border-[color:var(--pm-accent)] text-accent'
              : 'border text-mute'"
        >
          <i-lucide-check v-if="step > n" class="size-3.5" />
          <template v-else>{{ n }}</template>
        </span>
        <span
          v-if="n < TOTAL"
          class="h-px flex-1 transition-colors"
          :style="{ background: step > n ? 'var(--pm-accent)' : 'var(--pm-border)' }"
        />
      </li>
    </ol>

    <PmAlert v-if="error" tone="danger" class="mb-5">{{ error }}</PmAlert>

    <!-- 1 · platform -->
    <template v-if="step === 1">
      <h2 class="text-xl font-semibold">Connect your CI/CD</h2>
      <p class="mt-1 text-sm text-dim">Choose the platform that runs your pipelines.</p>
      <ProviderPicker v-model="form.provider" class="mt-6" />
    </template>

    <!-- 2 · instance -->
    <template v-else-if="step === 2 && spec">
      <h2 class="text-xl font-semibold">Where does {{ spec.label }} run?</h2>
      <p class="mt-1 text-sm text-dim">
        This decides which API endpoint PipeMind talks to.
      </p>

      <div class="mt-6 space-y-3">
        <button
          v-if="spec.cloud"
          class="flex w-full items-center gap-3 rounded-[var(--pm-radius-lg)] border p-4 text-left transition-colors"
          :class="form.instance === 'cloud'
            ? 'border-[color:var(--pm-accent)] bg-[var(--pm-accent-dim)]'
            : 'hover:bg-surface-2'"
          @click="form.instance = 'cloud'; form.baseUrl = spec.cloud.baseUrl"
        >
          <i-lucide-cloud class="size-5 shrink-0 text-accent" />
          <span>
            <span class="block text-sm font-medium">Cloud</span>
            <span class="block text-xs text-dim">{{ spec.cloud.label }}</span>
          </span>
        </button>

        <button
          v-if="spec.selfHosted"
          class="flex w-full items-center gap-3 rounded-[var(--pm-radius-lg)] border p-4 text-left transition-colors"
          :class="form.instance === 'self_hosted'
            ? 'border-[color:var(--pm-accent)] bg-[var(--pm-accent-dim)]'
            : 'hover:bg-surface-2'"
          @click="form.instance = 'self_hosted'; form.baseUrl = ''"
        >
          <i-lucide-server class="size-5 shrink-0 text-accent" />
          <span>
            <span class="block text-sm font-medium">Self-hosted</span>
            <span class="block text-xs text-dim">{{ spec.selfHosted.label }}</span>
          </span>
        </button>

        <PmInput
          v-if="form.instance === 'self_hosted' && spec.selfHosted"
          v-model="form.baseUrl"
          label="Instance URL"
          :placeholder="spec.selfHosted.placeholder"
          icon="i-lucide-link"
        />
      </div>
    </template>

    <!-- 3 · authenticate -->
    <template v-else-if="step === 3 && spec">
      <h2 class="text-xl font-semibold">Authenticate</h2>
      <p class="mt-1 text-sm text-dim">PipeMind stores this encrypted and never returns it.</p>

      <div class="mt-6 space-y-4">
        <PmInput v-model="form.name" label="Connection name" placeholder="GitHub Actions" />

        <PmInput
          v-for="field in spec.auth"
          :key="field.key"
          v-model="form[field.key]"
          :label="field.label"
          :placeholder="field.placeholder"
          :type="field.type"
        />

        <PmAlert tone="info">
          {{ spec.scopeHint }}
          <a
            v-if="spec.tokenUrl"
            :href="spec.tokenUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="ml-1 underline"
          >Create a token →</a>
        </PmAlert>

        <PmButton
          variant="secondary"
          :loading="testConnection.isPending.value"
          :disabled="!form.token.trim() && spec.auth.length > 0"
          @click="runTest"
        >
          <i-lucide-plug-zap class="size-4" /> Test connection
        </PmButton>

        <ConnectionResult v-if="identity" :identity="identity" />
      </div>
    </template>

    <!-- 4 · import -->
    <template v-else-if="step === 4">
      <h2 class="text-xl font-semibold">Import repositories</h2>
      <p class="mt-1 text-sm text-dim">
        PipeMind registers a webhook on each one so it can follow your pipelines.
      </p>

      <!--
        Blocking, not advisory: GitHub and GitLab both refuse a webhook URL that
        resolves to localhost, so the import cannot succeed from here.
      -->
      <PmAlert v-if="webhookSettings && !webhookSettings.reachable" tone="danger" class="mt-4">
        <strong>Start a tunnel first.</strong>
        Webhooks would point at <code class="font-mono">{{ webhookSettings.webhook_base_url }}</code>,
        which your provider cannot reach — it will reject the webhook.
        <span class="mt-2 block">
          Run <code class="font-mono">php artisan pipemind:tunnel</code> in the backend,
          or set a public URL under Integrations → Public webhook URL.
        </span>
      </PmAlert>

      <PmInput
        v-model="search"
        class="mt-5"
        placeholder="Search repositories…"
        icon="i-lucide-search"
      />

      <div class="mt-4 max-h-[380px] space-y-1.5 overflow-y-auto pr-1">
        <PmSkeleton v-if="loadingRepos" class="h-16 w-full" />

        <button
          v-for="repo in repositories"
          :key="repo.external_id"
          :disabled="repo.already_imported"
          class="flex w-full items-center gap-3 rounded-[var(--pm-radius)] border p-3 text-left transition-colors disabled:opacity-45"
          :class="selected.has(repo.external_id)
            ? 'border-[color:var(--pm-accent)] bg-[var(--pm-accent-dim)]'
            : 'hover:bg-surface-2'"
          @click="toggle(repo.external_id)"
        >
          <span
            class="grid size-4 shrink-0 place-items-center rounded border"
            :class="selected.has(repo.external_id) && 'border-[color:var(--pm-accent)] bg-accent'"
          >
            <i-lucide-check
              v-if="selected.has(repo.external_id)"
              class="size-3 text-[var(--pm-on-accent)]"
            />
          </span>

          <span class="min-w-0 flex-1">
            <span class="block truncate text-[13px] font-medium">{{ repo.path }}</span>
            <span v-if="repo.description" class="block truncate text-xs text-dim">
              {{ repo.description }}
            </span>
          </span>

          <PmBadge v-if="repo.already_imported" tone="dim">Monitored</PmBadge>
        </button>

        <PmEmptyState
          v-if="!loadingRepos && !repositories?.length"
          compact
          icon="i-lucide-folder-search"
          title="No repositories found"
        />
      </div>
    </template>

    <!-- 5 · result -->
    <template v-else-if="step === 5 && importResults">
      <h2 class="text-xl font-semibold">Import complete</h2>
      <p class="mt-1 text-sm text-dim">
        A repository imported without a working webhook will look fine and do nothing,
        so PipeMind reports each one separately.
      </p>

      <ul class="mt-6 space-y-2">
        <li
          v-for="result in importResults"
          :key="result.external_id"
          class="flex items-start gap-3 rounded-[var(--pm-radius)] border p-3"
        >
          <i-lucide-circle-check v-if="result.webhook" class="mt-0.5 size-4 shrink-0 text-accent" />
          <i-lucide-triangle-alert v-else class="mt-0.5 size-4 shrink-0 text-[var(--pm-warning)]" />

          <span class="min-w-0 flex-1">
            <span class="block text-[13px] font-medium">{{ result.name }}</span>
            <span class="block text-xs" :class="result.webhook ? 'text-dim' : 'text-[var(--pm-warning)]'">
              {{ result.webhook ? 'Webhook registered' : (result.error ?? 'Webhook failed') }}
            </span>
          </span>
        </li>
      </ul>
    </template>

    <!-- navigation -->
    <div class="mt-8 flex items-center justify-between gap-3 border-t pt-5">
      <PmButton variant="ghost" @click="step > 1 && step < 5 ? step-- : emit('cancel')">
        {{ step > 1 && step < 5 ? 'Back' : 'Cancel' }}
      </PmButton>

      <PmButton
        v-if="step < 3"
        variant="primary"
        :disabled="!canAdvance"
        @click="step++"
      >
        Continue <i-lucide-arrow-right class="size-4" />
      </PmButton>

      <PmButton
        v-else-if="step === 3"
        variant="primary"
        :disabled="!identity"
        :loading="createIntegration.isPending.value"
        @click="saveAndContinue"
      >
        Save &amp; continue <i-lucide-arrow-right class="size-4" />
      </PmButton>

      <PmButton
        v-else-if="step === 4"
        variant="primary"
        :disabled="!canAdvance"
        :loading="importRepositories.isPending.value"
        @click="runImport"
      >
        Import {{ selected.size }} {{ selected.size === 1 ? 'repository' : 'repositories' }}
      </PmButton>

      <PmButton v-else variant="primary" @click="emit('done')">
        Done
      </PmButton>
    </div>
  </div>
</template>
