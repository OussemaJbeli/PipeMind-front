<script setup lang="ts">
import { computed, ref } from 'vue'

import { useDeleteIntegration, useTestIntegration } from '@/api/queries/integrations'
import { useRelativeTime } from '@/composables/useRelativeTime'
import type { Integration } from '@/types/api'
import { providerSpec } from './providerCatalog'

const props = defineProps<{ integration: Integration }>()
const emit = defineEmits<{ reRegister: [] }>()

const spec = computed(() => providerSpec(props.integration.provider))
const lastEvent = useRelativeTime(() => props.integration.last_event_at)

const testIntegration = useTestIntegration(() => props.integration.uuid)
const deleteIntegration = useDeleteIntegration()
const confirmingDelete = ref(false)

const statusTone = computed(() => {
  if (props.integration.status === 'error')
    return { color: 'var(--pm-danger)', label: 'Error' }

  // Silence is indistinguishable from "nothing happened" unless we say so.
  if (props.integration.looks_stale)
    return { color: 'var(--pm-warning)', label: 'No recent events' }

  return { color: 'var(--pm-success)', label: 'Active' }
})
</script>

<template>
  <PmCard>
    <div class="flex items-start gap-3">
      <PmIconTile :icon="spec.icon" :color="spec.color" />

      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-2">
          <h3 class="truncate text-[15px] font-semibold">{{ integration.name }}</h3>
          <span
            class="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-medium"
            :style="{
              color: statusTone.color,
              background: `color-mix(in srgb, ${statusTone.color} 14%, transparent)`,
            }"
          >
            <span class="size-1.5 rounded-full" :style="{ background: statusTone.color }" />
            {{ statusTone.label }}
          </span>
        </div>

        <p class="mt-0.5 truncate text-xs text-dim">
          {{ integration.instance_type === 'cloud' ? spec.cloud?.label : integration.base_url }}
          · {{ integration.projects_count ?? 0 }}
          {{ integration.projects_count === 1 ? 'project' : 'projects' }}
        </p>
      </div>
    </div>

    <PmAlert v-if="integration.last_error" tone="danger" class="mt-3">
      {{ integration.last_error }}
    </PmAlert>

    <dl class="mt-4 space-y-2 border-t pt-3 text-[13px]">
      <div class="flex items-center justify-between gap-3">
        <dt class="shrink-0 text-dim">Last event</dt>
        <dd :class="integration.looks_stale ? 'text-[var(--pm-warning)]' : 'text-fg'">
          {{ integration.last_event_at ? lastEvent : 'never' }}
        </dd>
      </div>

      <div class="flex items-start justify-between gap-3">
        <dt class="shrink-0 text-dim">Webhook URL</dt>
        <dd class="min-w-0 truncate font-mono text-[11px] text-mute" :title="integration.webhook_url">
          {{ integration.webhook_url }}
        </dd>
      </div>
    </dl>

    <div class="mt-4 flex flex-wrap gap-2">
      <PmButton size="sm" variant="secondary" :loading="testIntegration.isPending.value" @click="testIntegration.mutate()">
        <i-lucide-plug-zap class="size-3.5" /> Test
      </PmButton>

      <!-- Routine, not an edge case: a free tunnel rotates its hostname. -->
      <PmButton size="sm" variant="outline" @click="emit('reRegister')">
        <i-lucide-refresh-cw class="size-3.5" /> Re-register webhooks
      </PmButton>

      <PmButton
        size="sm"
        variant="ghost"
        class="ml-auto text-[var(--pm-danger)]"
        @click="confirmingDelete = true"
      >
        <i-lucide-trash-2 class="size-3.5" />
      </PmButton>
    </div>

    <div
      v-if="confirmingDelete"
      class="mt-3 rounded-[var(--pm-radius)] border border-[color:var(--pm-danger)]/30 bg-[color:var(--pm-danger)]/8 p-3"
    >
      <p class="text-[13px]">
        Disconnect <strong>{{ integration.name }}</strong>? Its webhooks are removed from the
        provider and its projects stop receiving pipelines. Existing history is kept.
      </p>
      <div class="mt-3 flex gap-2">
        <PmButton size="sm" variant="ghost" @click="confirmingDelete = false">Cancel</PmButton>
        <PmButton
          size="sm"
          variant="danger"
          :loading="deleteIntegration.isPending.value"
          @click="deleteIntegration.mutate(integration.uuid)"
        >
          Disconnect
        </PmButton>
      </div>
    </div>
  </PmCard>
</template>
