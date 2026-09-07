<script setup lang="ts">
import type { ApiError } from '@/api/client'
import { useUpdateWorkspace, useWorkspaceSettings } from '@/api/queries/workspaceAdmin'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const { data: settings, isPending, isError, error, refetch } = useWorkspaceSettings()
const update = useUpdateWorkspace()

const canManage = computed(() => auth.can('team.manage'))

const form = reactive({
  name: '',
  timezone: '',
  monthly_ai_budget_usd: '25',
  privacy_mode: 'cloud_redacted',
})

// Seeded once loaded, not on every refetch: overwriting while somebody is
// mid-edit would silently discard what they typed.
watch(settings, (loaded) => {
  if (loaded && !form.name) {
    form.name = loaded.name
    form.timezone = loaded.timezone
    form.monthly_ai_budget_usd = String(loaded.monthly_ai_budget_usd)
    form.privacy_mode = loaded.privacy_mode
  }
}, { immediate: true })

const saveError = ref<string | null>(null)
const saved = ref(false)

function save() {
  saveError.value = null
  saved.value = false

  update.mutate({ ...form, monthly_ai_budget_usd: Number(form.monthly_ai_budget_usd) }, {
    onSuccess: () => {
      saved.value = true
      setTimeout(() => (saved.value = false), 2400)
    },
    onError: thrown => (saveError.value = (thrown as unknown as ApiError).message),
  })
}
</script>

<template>
  <div class="mx-auto max-w-[820px]">
    <h1 class="text-xl font-semibold">Workspace settings</h1>
    <p class="mt-1 text-sm text-dim">
      Applies to everyone in this workspace.
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
            <AuthField v-model="form.name" label="Workspace name" :disabled="!canManage" />
            <AuthField
              v-model="form.timezone"
              label="Timezone"
              :disabled="!canManage"
              hint="Used for daily rollups and the failure heatmap."
            />
            <div class="text-xs text-mute">
              Slug <span class="font-mono">{{ settings.slug }}</span> · plan {{ settings.plan }}
            </div>
          </div>
        </PmCard>

        <PmCard class="mt-4" title="AI spend ceiling">
          <div class="space-y-4">
            <AuthField
              v-model="form.monthly_ai_budget_usd"
              label="Monthly budget (USD)"
              type="number"
              :disabled="!canManage"
              hint="Checked before every model call, never sampled after the fact."
            />
            <!--
              Named because it is the ceiling people actually hit first. A $25
              budget allows thousands of analyses; a free-tier key stops at 20 a
              day, and that limit is the provider's, not ours.
            -->
            <PmAlert tone="info">
              A provider's own quota may stop you long before this does — Google's
              free tier allows 20 analyses per day, whatever the budget says.
            </PmAlert>
          </div>
        </PmCard>

        <PmCard class="mt-4" title="Privacy">
          <div class="space-y-4">
            <PmSegmented
              v-model="form.privacy_mode"
              :options="[
                { key: 'cloud_redacted', label: 'Cloud, redacted' },
                { key: 'local_only', label: 'Local only' },
              ]"
              :disabled="!canManage"
            />

            <p class="text-sm leading-relaxed text-dim">
              <template v-if="form.privacy_mode === 'local_only'">
                Logs never reach a third party. Enforced server-side: if no local
                provider is configured, analysis fails loudly rather than quietly
                falling back to the cloud.
              </template>
              <template v-else>
                24 redaction rules run before anything is sent, and raw logs stay
                in your own object storage. The excerpt the model sees is clean;
                the stored original is untouched.
              </template>
            </p>
          </div>
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

        <!--
          What deletion would destroy, stated next to the button rather than
          discovered afterwards. Deleting is not wired up: it is irreversible,
          and an untested destructive path is worse than a missing one.
        -->
        <PmCard class="mt-8 border-[color:var(--pm-danger)]/30" title="Danger zone">
          <p class="text-sm text-dim">
            Deleting this workspace would permanently remove
            <span class="font-medium text-fg">{{ settings.contents.projects }} projects</span>,
            <span class="font-medium text-fg">{{ settings.contents.failures }} failures</span>,
            <span class="font-medium text-fg">{{ settings.contents.integrations }} integrations</span>
            and remove {{ settings.contents.members }} member(s).
          </p>
          <p class="mt-2 text-xs text-mute">
            Every analysis and confirmed fix goes with it — that history is what
            makes future failures answer themselves.
          </p>
          <PmButton variant="danger" size="sm" class="mt-4" disabled>
            Delete workspace
          </PmButton>
          <p class="mt-1.5 text-[11px] text-mute">Not yet available.</p>
        </PmCard>
      </template>
    </PmAsyncBoundary>
  </div>
</template>
