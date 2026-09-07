<script setup lang="ts">
import type { ApiError } from '@/api/client'
import { useRouter } from 'vue-router'

import { useProjectSettings } from '@/api/queries/project'
import { useRelativeTime } from '@/composables/useRelativeTime'

const props = defineProps<{ slug: string }>()

const router = useRouter()

const { data: settings, isPending, isError, error, refetch } = useProjectSettings(() => props.slug)

const integration = computed(() => settings.value?.integration ?? null)
const lastEvent = useRelativeTime(() => integration.value?.last_event_at)
const lastPipeline = useRelativeTime(() => settings.value?.stats.last_pipeline_at)

const PROVIDER_LABELS: Record<string, string> = {
  github: 'GitHub',
  gitlab: 'GitLab',
  jenkins: 'Jenkins',
  generic: 'Generic webhook',
}

/**
 * "Connected" is not the same as "working". An integration can be active and
 * still be receiving nothing — a hook deleted on the provider side looks
 * identical to a quiet week from in here, which is exactly the failure this
 * panel exists to make visible.
 */
const health = computed(() => {
  if (!integration.value)
    return { tone: 'danger', label: 'Not connected' } as const

  if (integration.value.last_error)
    return { tone: 'danger', label: 'Last delivery failed' } as const

  if (integration.value.status !== 'active')
    return { tone: 'warning', label: integration.value.status } as const

  if (!integration.value.last_event_at)
    return { tone: 'warning', label: 'No events received yet' } as const

  return { tone: 'success', label: 'Receiving events' } as const
})
</script>

<template>
  <div class="mx-auto max-w-[820px]">
    <h1 class="text-xl font-semibold">Integration</h1>
    <p class="mt-1 text-sm text-dim">
      Where this project's pipeline events come from.
    </p>

    <PmAsyncBoundary
      class="mt-5"
      :loading="isPending"
      :error="isError ? (error as unknown as ApiError) : null"
      @retry="refetch"
    >
      <template v-if="settings" #default>
        <!--
          A project with no integration is the quiet failure this whole screen is
          for: everything looks fine and nothing ever arrives.
        -->
        <PmCard v-if="!integration">
          <PmEmptyState
            icon="i-lucide-unplug"
            title="This project has no integration"
            message="Nothing is being ingested, so no pipelines, failures or analyses
                     will ever appear. Connect a provider from the workspace
                     Integrations page, then import this repository."
          />
          <div class="flex justify-center">
            <PmButton variant="primary" @click="router.push({ name: 'integrations' })">
              Go to Integrations
            </PmButton>
          </div>
        </PmCard>

        <template v-else>
          <PmCard>
            <div class="flex items-start gap-4">
              <PmIconTile icon="i-lucide-plug" class="mt-0.5 shrink-0" />

              <div class="min-w-0 flex-1">
                <div class="flex flex-wrap items-center gap-2">
                  <h2 class="text-[15px] font-medium">
                    {{ PROVIDER_LABELS[integration.provider] ?? integration.provider }}
                  </h2>
                  <PmBadge :tone="health.tone">{{ health.label }}</PmBadge>
                </div>

                <p class="mt-1 truncate text-xs text-dim">
                  {{ integration.name }}
                  <template v-if="integration.base_url">
                    · <span class="font-mono">{{ integration.base_url }}</span>
                  </template>
                </p>
              </div>
            </div>

            <dl class="mt-5 grid gap-4 border-t pt-4 sm:grid-cols-2">
              <div>
                <dt class="text-[11px] uppercase tracking-wide text-mute">Repository path</dt>
                <dd class="mt-1 font-mono text-xs">{{ integration.external_path ?? '—' }}</dd>
              </div>
              <div>
                <dt class="text-[11px] uppercase tracking-wide text-mute">External ID</dt>
                <dd class="mt-1 font-mono text-xs">{{ integration.external_id ?? '—' }}</dd>
              </div>
              <div>
                <dt class="text-[11px] uppercase tracking-wide text-mute">Last event received</dt>
                <dd class="mt-1 text-xs">{{ lastEvent }}</dd>
              </div>
              <div>
                <dt class="text-[11px] uppercase tracking-wide text-mute">Last pipeline</dt>
                <dd class="mt-1 text-xs">{{ lastPipeline }}</dd>
              </div>
            </dl>
          </PmCard>

          <!--
            The error text verbatim, not a friendly paraphrase: it usually names
            the exact cause (a revoked token, a 404 on a deleted hook), and a
            paraphrase would throw that away.
          -->
          <PmAlert v-if="integration.last_error" tone="danger" class="mt-4">
            <p class="font-medium">The provider rejected the last delivery</p>
            <p class="mt-1 font-mono text-[11px] leading-relaxed">{{ integration.last_error }}</p>
          </PmAlert>

          <PmAlert v-else-if="!integration.last_event_at" tone="warning" class="mt-4">
            Connected, but nothing has arrived yet. Push a commit or re-run a
            pipeline — if it stays empty, the webhook exists on our side but not
            on the provider's.
          </PmAlert>

          <PmCard class="mt-4" title="What gets ingested">
            <ul class="space-y-2 text-sm text-dim">
              <li class="flex gap-2">
                <i-lucide-check class="mt-0.5 size-3.5 shrink-0 text-[color:var(--pm-success)]" />
                Pipeline and job status, timing and the commit that triggered the run.
              </li>
              <li class="flex gap-2">
                <i-lucide-check class="mt-0.5 size-3.5 shrink-0 text-[color:var(--pm-success)]" />
                Job logs for failed jobs, redacted before storage and before any model sees them.
              </li>
              <li class="flex gap-2">
                <i-lucide-check class="mt-0.5 size-3.5 shrink-0 text-[color:var(--pm-success)]" />
                Changed files and their diffs — what turns "check recent changes" into a named line.
              </li>
            </ul>
            <p class="mt-3 text-xs text-mute">
              Managed at the workspace level, since one connection usually serves
              several projects.
            </p>
            <div class="mt-3">
              <PmButton variant="outline" size="sm" @click="router.push({ name: 'integrations' })">
                Manage connection
              </PmButton>
            </div>
          </PmCard>
        </template>
      </template>
    </PmAsyncBoundary>
  </div>
</template>
