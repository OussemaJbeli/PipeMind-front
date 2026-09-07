<script setup lang="ts">
import { ref } from 'vue'

import type { ApiError } from '@/api/client'
import { useIntegrations, useReRegisterWebhooks } from '@/api/queries/integrations'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const { data: integrations, isLoading, error, refetch } = useIntegrations()

const showWizard = ref(false)
const activeUuid = ref<string>('')
const reRegister = useReRegisterWebhooks(activeUuid)
const feedback = ref<{ ok: boolean, message: string } | null>(null)

async function applyWebhookUrl(url: string) {
  feedback.value = null

  // Re-point every integration, not just one: a new tunnel invalidates them all.
  for (const integration of integrations.value ?? []) {
    activeUuid.value = integration.uuid

    try {
      const result = await reRegister.mutateAsync(url)

      feedback.value = result.meta.failed > 0
        ? { ok: false, message: `${result.meta.failed} of ${result.meta.total} webhooks could not be re-registered.` }
        : { ok: true, message: `Re-registered ${result.meta.total} webhook(s) at the new URL.` }
    }
    catch (e) {
      feedback.value = { ok: false, message: (e as ApiError).message }
    }
  }
}

async function reRegisterOne(uuid: string) {
  activeUuid.value = uuid
  feedback.value = null

  try {
    const result = await reRegister.mutateAsync(undefined)
    feedback.value = {
      ok: result.meta.failed === 0,
      message: `Re-registered ${result.meta.total - result.meta.failed} of ${result.meta.total} webhook(s).`,
    }
  }
  catch (e) {
    feedback.value = { ok: false, message: (e as ApiError).message }
  }
}
</script>

<template>
  <div class="mx-auto max-w-[1200px]">
    <template v-if="showWizard">
      <IntegrationWizard
        @done="showWizard = false; refetch()"
        @cancel="showWizard = false"
      />
    </template>

    <template v-else>
      <header class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="text-2xl font-semibold">Integrations</h1>
          <p class="mt-1 text-sm text-dim">
            Connect the CI/CD platforms that run your pipelines.
          </p>
        </div>

        <PmButton v-if="auth.can('integrations.manage')" variant="primary" @click="showWizard = true">
          <i-lucide-plus class="size-4" /> Add integration
        </PmButton>
      </header>

      <PmAlert v-if="feedback" :tone="feedback.ok ? 'success' : 'warning'" class="mt-5">
        {{ feedback.message }}
      </PmAlert>

      <div class="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section>
          <PmAsyncBoundary
            :loading="isLoading"
            :error="(error as ApiError | null)"
            :empty="!integrations?.length"
            empty-title="No integrations yet"
            empty-message="Connect GitHub Actions, GitLab CI or Jenkins to start monitoring pipelines."
            @retry="refetch()"
          >
            <template #empty-action>
              <PmButton variant="primary" @click="showWizard = true">
                Connect CI/CD
              </PmButton>
            </template>

            <div class="grid gap-4">
              <IntegrationCard
                v-for="integration in integrations"
                :key="integration.uuid"
                :integration="integration"
                @re-register="reRegisterOne(integration.uuid)"
              />
            </div>
          </PmAsyncBoundary>
        </section>

        <aside>
          <WebhookUrlPanel @apply="applyWebhookUrl" />
        </aside>
      </div>
    </template>
  </div>
</template>
