<script setup lang="ts">
import type { ApiError } from '@/api/client'
import { useProjectSettings, useUpdateProject } from '@/api/queries/project'
import { useAiProviders } from '@/api/queries/workspaceAdmin'
import { useAuthStore } from '@/stores/auth'

const props = defineProps<{ slug: string }>()

const auth = useAuthStore()
const canManage = computed(() => auth.can('projects.manage'))

const { data: settings, isPending, isError, error, refetch } = useProjectSettings(() => props.slug)
const { data: providers } = useAiProviders()
const update = useUpdateProject(() => props.slug)

const form = reactive({
  name: '',
  description: '',
  default_branch: '',
  tech_stack: '',
  is_active: true,
  auto_analyze: true,
  // '*' is stored as a real branch entry server-side; the UI presents it as a
  // mode instead, because "analyze every branch" is a decision, not a pattern
  // somebody wants to type.
  branch_mode: 'all' as 'all' | 'list',
  branches: '',
  ai_provider_uuid: '',
})

// Seeded once, not on every refetch: overwriting mid-edit discards typing.
const seeded = ref(false)

watch(settings, (loaded) => {
  if (!loaded || seeded.value)
    return

  const everyBranch = loaded.analyze_on_branches.includes('*')

  Object.assign(form, {
    name: loaded.name,
    description: loaded.description ?? '',
    default_branch: loaded.default_branch,
    tech_stack: loaded.tech_stack.join(', '),
    is_active: loaded.is_active,
    auto_analyze: loaded.auto_analyze,
    branch_mode: everyBranch ? 'all' : 'list',
    branches: everyBranch ? '' : loaded.analyze_on_branches.join(', '),
    ai_provider_uuid: loaded.ai_provider?.uuid ?? '',
  })

  seeded.value = true
}, { immediate: true })

const providerOptions = computed(() => [
  { key: '', label: 'Workspace default' },
  ...(providers.value ?? []).map(p => ({
    key: p.uuid,
    label: p.model ? `${p.name} — ${p.model}` : p.name,
  })),
])

function splitList(value: string) {
  return value.split(',').map(part => part.trim()).filter(Boolean)
}

const saveError = ref<string | null>(null)
const fieldErrors = ref<Record<string, string[]>>({})
const saved = ref(false)

function save() {
  saveError.value = null
  fieldErrors.value = {}
  saved.value = false

  update.mutate({
    name: form.name.trim(),
    description: form.description.trim() || null,
    default_branch: form.default_branch.trim(),
    tech_stack: splitList(form.tech_stack),
    is_active: form.is_active,
    auto_analyze: form.auto_analyze,
    analyze_on_branches: form.branch_mode === 'all' ? ['*'] : splitList(form.branches),
    ai_provider_uuid: form.ai_provider_uuid || null,
  }, {
    onSuccess: () => {
      saved.value = true
      setTimeout(() => (saved.value = false), 2400)
    },
    onError: (thrown) => {
      const failure = thrown as unknown as ApiError
      saveError.value = failure.message
      fieldErrors.value = failure.validation ?? {}
    },
  })
}

const listedNoBranches = computed(() =>
  form.branch_mode === 'list' && splitList(form.branches).length === 0)
</script>

<template>
  <div class="mx-auto max-w-[820px]">
    <h1 class="text-xl font-semibold">Project settings</h1>
    <p class="mt-1 text-sm text-dim">
      Applies to this project only.
    </p>

    <PmAsyncBoundary
      class="mt-5"
      :loading="isPending"
      :error="isError ? (error as unknown as ApiError) : null"
      @retry="refetch"
    >
      <template v-if="settings" #default>
        <PmCard title="General">
          <div class="space-y-4">
            <AuthField v-model="form.name" label="Name" :disabled="!canManage" :errors="fieldErrors.name" />

            <div>
              <label for="project-description" class="mb-1.5 block text-[13px] font-medium">
                Description
              </label>
              <textarea
                id="project-description"
                v-model="form.description"
                rows="3"
                :disabled="!canManage"
                class="w-full rounded-[var(--pm-radius)] border bg-surface-2 p-3 text-sm outline-none focus:border-[color:var(--pm-accent)] disabled:opacity-50"
              />
            </div>

            <AuthField
              v-model="form.tech_stack"
              label="Tech stack"
              :required="false"
              :disabled="!canManage"
              hint="Comma separated. Sent with every analysis, so the model suggests fixes in the right ecosystem."
            />

            <AuthField
              v-model="form.default_branch"
              label="Default branch"
              :disabled="!canManage"
              :errors="fieldErrors.default_branch"
              hint="Patches are only ever suggested against other branches — never applied to this one."
            />

            <div class="text-xs text-mute">
              Slug <span class="font-mono">{{ settings.slug }}</span>
              <template v-if="settings.repository_url">
                ·
                <a
                  :href="settings.repository_url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="underline hover:text-fg"
                >repository</a>
              </template>
              · {{ settings.stats.pipelines }} pipelines · {{ settings.stats.failures }} failures
            </div>
          </div>
        </PmCard>

        <PmCard class="mt-4" title="Analysis">
          <div class="space-y-4">
            <PmToggle
              v-model="form.auto_analyze"
              label="Analyse failures automatically"
              description="Off means failures are still recorded and grouped; you trigger the model yourself."
              :disabled="!canManage"
            />

            <div>
              <PmSegmented
                v-model="form.branch_mode"
                :options="[
                  { key: 'all', label: 'Every branch' },
                  { key: 'list', label: 'Selected branches' },
                ]"
                :disabled="!canManage || !form.auto_analyze"
              />

              <AuthField
                v-if="form.branch_mode === 'list'"
                v-model="form.branches"
                class="mt-3"
                label="Branches to analyse"
                :required="false"
                :disabled="!canManage || !form.auto_analyze"
                hint="Comma separated. Analyses cost money, so restricting this to the branches you actually watch is the usual choice."
              />

              <!--
                An empty list is silently equivalent to analysing nothing, which
                looks identical to auto-analysis being broken.
              -->
              <PmAlert v-if="listedNoBranches" tone="warning" class="mt-3">
                No branches listed, so nothing will be analysed automatically.
              </PmAlert>
            </div>

            <PmSelect
              v-model="form.ai_provider_uuid"
              label="AI provider"
              :options="providerOptions"
              :disabled="!canManage"
            />
            <p class="-mt-2 text-xs text-mute">
              Overrides the workspace default for this project only — useful for
              pointing one repository at a local model.
            </p>
          </div>
        </PmCard>

        <PmCard class="mt-4" title="Status">
          <PmToggle
            v-model="form.is_active"
            label="Project is active"
            description="Inactive projects stop ingesting events and disappear from dashboards. Nothing already recorded is deleted."
            :disabled="!canManage"
          />
        </PmCard>

        <div v-if="canManage" class="mt-4 flex items-center gap-3">
          <PmButton variant="primary" :loading="update.isPending.value" @click="save">
            Save changes
          </PmButton>
          <p v-if="saved" class="flex items-center gap-1.5 text-xs text-accent">
            <i-lucide-check class="size-3.5" />Saved
          </p>
        </div>

        <PmAlert v-if="saveError" tone="danger" class="mt-4">{{ saveError }}</PmAlert>
      </template>
    </PmAsyncBoundary>
  </div>
</template>
