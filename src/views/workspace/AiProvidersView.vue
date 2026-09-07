<script setup lang="ts">
import type { ApiError } from '@/api/client'
import {
  useAiProviders,
  useAiUsage,
  useDeleteProvider,
  useSaveProvider,
  useTestProvider,
} from '@/api/queries/workspaceAdmin'
import type { AiProvider } from '@/types/api'

const { data: providers, isPending, isError, error, refetch } = useAiProviders()
const { data: usage } = useAiUsage(30)

const test = useTestProvider()
const save = useSaveProvider()
const remove = useDeleteProvider()

const editing = ref<AiProvider | null>(null)
const adding = ref(false)

const form = reactive({
  name: '',
  provider: 'gemini',
  model: '',
  api_key: '',
  base_url: '',
  is_default: false,
})

const MODELS: Record<string, string> = {
  gemini: 'gemini-3.6-flash',
  openai: 'gpt-4o-mini',
  ollama: 'qwen2.5-coder:7b',
}

function startAdd() {
  Object.assign(form, {
    name: '', provider: 'gemini', model: '', api_key: '', base_url: '', is_default: !providers.value?.length,
  })
  test.reset()
  editing.value = null
  adding.value = true
}

function startEdit(provider: AiProvider) {
  Object.assign(form, {
    name: provider.name,
    provider: provider.provider,
    model: provider.model,
    api_key: '',
    base_url: provider.base_url ?? '',
    is_default: provider.is_default,
  })
  test.reset()
  editing.value = provider
  adding.value = true
}

function runTest() {
  test.mutate({
    provider: form.provider,
    api_key: form.api_key || undefined,
    model: form.model || MODELS[form.provider],
    base_url: form.base_url || undefined,
  })
}

const saveError = ref<string | null>(null)

function persist() {
  saveError.value = null

  save.mutate({
    uuid: editing.value?.uuid,
    name: form.name || (form.provider === 'ollama' ? 'Ollama (local)' : form.provider),
    provider: form.provider,
    model: form.model || MODELS[form.provider],
    api_key: form.api_key || undefined,
    base_url: form.base_url || undefined,
    is_default: form.is_default,
    is_local: form.provider === 'ollama',
  }, {
    onSuccess: () => (adding.value = false),
    onError: thrown => (saveError.value = (thrown as unknown as ApiError).message),
  })
}

const STATUS_TONE: Record<string, 'accent' | 'warning' | 'danger' | 'dim'> = {
  active: 'accent',
  error: 'danger',
  untested: 'warning',
  disabled: 'dim',
}

// Editing an existing provider without re-entering the key must stay possible:
// the key is never returned, so requiring a fresh test would mean retyping it to
// change a display name.
const canSave = computed(() =>
  Boolean(test.data.value?.ok) || (editing.value !== null && !form.api_key),
)
</script>

<template>
  <div class="mx-auto max-w-[1100px]">
    <div class="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 class="text-xl font-semibold">AI providers</h1>
        <p class="mt-1 text-sm text-dim">
          Which model analyses your failures, and what it costs.
        </p>
      </div>
      <PmButton variant="primary" size="sm" @click="startAdd">
        Add provider
      </PmButton>
    </div>

    <BudgetBar v-if="usage" :usage="usage" class="mb-5" />

    <PmAsyncBoundary
      :loading="isPending"
      :error="isError ? (error as unknown as ApiError) : null"
      :empty="!providers?.length && !adding"
      empty-title="No AI provider yet"
      empty-message="PipeMind still classifies failures with rules, but nothing will explain them."
      @retry="refetch"
    >
      <div class="space-y-2">
        <PmCard v-for="provider in providers" :key="provider.uuid">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="flex flex-wrap items-center gap-2 text-[15px] font-medium">
                {{ provider.name }}
                <PmBadge v-if="provider.is_default" tone="accent" size="sm">default</PmBadge>
                <PmBadge v-if="provider.is_local" tone="dim" size="sm">local</PmBadge>
                <PmBadge :tone="STATUS_TONE[provider.status] ?? 'dim'" size="sm">
                  {{ provider.status }}
                </PmBadge>
              </p>
              <p class="mt-1 font-mono text-[12px] text-dim">
                {{ provider.provider }} / {{ provider.model }}
              </p>
              <p v-if="provider.last_error" class="mt-2 text-xs text-[var(--pm-warning)]">
                {{ provider.last_error }}
              </p>
              <p class="mt-2 text-[11px] text-mute">
                ${{ provider.input_cost_per_1k }}/1k in · ${{ provider.output_cost_per_1k }}/1k out
                <template v-if="provider.projects_count">
                  · used by {{ provider.projects_count }} project(s)
                </template>
              </p>
            </div>

            <div class="flex shrink-0 gap-2">
              <PmButton size="sm" variant="secondary" @click="startEdit(provider)">
                Edit
              </PmButton>
              <PmButton
                size="sm" variant="ghost"
                :disabled="remove.isPending.value"
                @click="remove.mutate(provider.uuid)"
              >
                Remove
              </PmButton>
            </div>
          </div>
        </PmCard>
      </div>
    </PmAsyncBoundary>

    <PmCard v-if="adding" class="mt-4" :title="editing ? `Edit ${editing.name}` : 'Add a provider'">
      <div class="space-y-4">
        <PmSegmented
          v-model="form.provider"
          :options="[
            { key: 'gemini', label: 'Gemini' },
            { key: 'openai', label: 'OpenAI-compatible' },
            { key: 'ollama', label: 'Ollama (local)' },
          ]"
        />

        <AuthField v-model="form.name" label="Display name" :required="false" :placeholder="form.provider" />
        <AuthField v-model="form.model" label="Model" :required="false" :placeholder="MODELS[form.provider]" />

        <AuthField
          v-if="form.provider !== 'ollama'"
          v-model="form.api_key"
          label="API key"
          type="password"
          :required="!editing"
          :placeholder="editing?.has_api_key ? 'Leave blank to keep the current key' : 'AQ.Ab8… or AIza…'"
        />

        <AuthField
          v-if="form.provider !== 'gemini'"
          v-model="form.base_url"
          label="Base URL"
          :required="false"
          :placeholder="form.provider === 'ollama' ? 'http://localhost:11434' : 'https://api.openai.com/v1'"
        />

        <label class="flex cursor-pointer items-center gap-2 text-[13px] text-dim">
          <input v-model="form.is_default" type="checkbox" class="accent-[var(--pm-accent)]">
          Use for every project by default
        </label>

        <div class="flex flex-wrap items-center gap-3 border-t pt-4">
          <PmButton variant="secondary" size="sm" :loading="test.isPending.value" @click="runTest">
            Test connection
          </PmButton>

          <p
            v-if="test.data.value"
            class="flex items-start gap-1.5 text-xs"
            :class="test.data.value.ok ? 'text-accent' : 'text-[var(--pm-warning)]'"
          >
            <i
              :class="test.data.value.ok ? 'i-lucide-check' : 'i-lucide-triangle-alert'"
              class="mt-0.5 size-3.5 shrink-0"
            />
            {{ test.data.value.message }}
          </p>
        </div>

        <!-- The model list comes from the provider itself, so a retired model is
             visible here rather than discovered on the first real analysis. -->
        <div v-if="test.data.value?.models?.length" class="text-xs text-mute">
          {{ test.data.value.models.length }} models reachable with this key.
          <button
            v-for="m in test.data.value.models.slice(0, 6)"
            :key="m"
            class="ml-1 underline-offset-2 hover:text-accent hover:underline"
            @click="form.model = m"
          >
            {{ m }}
          </button>
        </div>

        <PmAlert v-if="saveError" tone="danger">{{ saveError }}</PmAlert>

        <div class="flex gap-2 border-t pt-4">
          <PmButton
            variant="primary"
            :disabled="!canSave"
            :loading="save.isPending.value"
            @click="persist"
          >
            {{ editing ? 'Save changes' : 'Add provider' }}
          </PmButton>
          <PmButton variant="ghost" @click="adding = false">Cancel</PmButton>
        </div>

        <p v-if="!canSave" class="text-[11px] text-mute">
          Test the connection first — a provider saved untested fails on the next
          real analysis, in a queue, with nobody watching.
        </p>
      </div>
    </PmCard>
  </div>
</template>
