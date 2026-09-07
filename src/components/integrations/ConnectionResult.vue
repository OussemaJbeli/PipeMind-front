<script setup lang="ts">
import type { ConnectionIdentity } from '@/types/api'

defineProps<{ identity: ConnectionIdentity }>()

const CAPABILITIES = [
  { key: 'read_projects', label: 'Read repositories', required: true },
  { key: 'retry_jobs', label: 'Retry jobs', required: false },
  { key: 'create_issues', label: 'Create issues', required: false },
] as const
</script>

<template>
  <div class="rounded-[var(--pm-radius-lg)] border border-[color:var(--pm-accent)]/35 bg-[var(--pm-accent-dim)] p-4">
    <div class="flex items-center gap-3">
      <PmAvatar
        :initials="identity.username.slice(0, 2).toUpperCase()"
        :src="identity.avatar_url"
      />
      <div class="min-w-0 flex-1">
        <p class="flex items-center gap-1.5 text-[14px] font-semibold">
          <i-lucide-circle-check class="size-4 shrink-0 text-accent" />
          Connected as {{ identity.username }}
        </p>
        <p v-if="identity.project_count !== null" class="mt-0.5 text-xs text-dim">
          {{ identity.project_count }} repositories visible
        </p>
      </div>
    </div>

    <!--
      What the token can actually DO, probed rather than claimed. A read-only
      token that silently cannot retry a job is the single most common source
      of confusion three days after setup.
    -->
    <dl class="mt-4 space-y-1.5 border-t border-[color:var(--pm-accent)]/20 pt-3">
      <div
        v-for="capability in CAPABILITIES"
        :key="capability.key"
        class="flex items-center justify-between text-[13px]"
      >
        <dt class="text-dim">{{ capability.label }}</dt>
        <dd class="flex items-center gap-1.5">
          <template v-if="identity.capabilities[capability.key]">
            <i-lucide-check class="size-3.5 text-accent" />
            <span class="text-accent">Yes</span>
          </template>
          <template v-else>
            <i-lucide-x class="size-3.5" :class="capability.required ? 'text-[var(--pm-danger)]' : 'text-mute'" />
            <span :class="capability.required ? 'text-[var(--pm-danger)]' : 'text-mute'">
              {{ capability.required ? 'Required' : 'No' }}
            </span>
          </template>
        </dd>
      </div>
    </dl>

    <p v-if="!identity.capabilities.retry_jobs" class="mt-3 text-xs leading-relaxed text-dim">
      PipeMind can monitor and analyse pipelines, but automated remediation will be
      unavailable until the token has write access.
    </p>
  </div>
</template>
