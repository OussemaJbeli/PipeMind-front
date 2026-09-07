<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query'

import { api } from '@/api/client'
import type { Envelope, ProjectCard } from '@/types/api'

const props = defineProps<{ projects: ProjectCard[] }>()
const emit = defineEmits<{ arrived: [slug: string], skip: [] }>()

const since = new Date()

/**
 * Polls until the first pipeline lands.
 *
 * The moment it arrives is the first genuinely delightful thing the product
 * does, and it costs one polling loop. Dropping the user on an empty dashboard
 * instead wastes it entirely — they would be looking at a blank board with no
 * idea whether anything is wired up.
 */
const { data: arrived } = useQuery({
  queryKey: ['onboarding-wait'],
  queryFn: async () => {
    for (const project of props.projects) {
      const { data } = await api.get<Envelope<{ recent_pipelines: { uuid: string }[] }>>(
        `/projects/${project.slug}/overview`,
        { params: { range: '24h' } },
      )

      if (data.data.recent_pipelines.length) {
        emit('arrived', project.slug)

        return project.slug
      }
    }

    return null
  },
  refetchInterval: query => (query.state.data ? false : 5_000),
  refetchIntervalInBackground: false,
  enabled: computed(() => props.projects.length > 0),
})

const command = 'git commit --allow-empty -m "hello pipemind" && git push'
const copied = ref(false)

async function copy() {
  try {
    await navigator.clipboard.writeText(command)
    copied.value = true
    setTimeout(() => (copied.value = false), 1600)
  }
  catch {
    // Clipboard is permission-gated and unavailable over plain HTTP. The command
    // is selectable text either way, so failing silently costs the user nothing.
  }
}
</script>

<template>
  <div class="mx-auto max-w-xl text-center">
    <div class="mx-auto grid size-12 place-items-center rounded-full bg-[color:var(--pm-accent)]/12">
      <i-lucide-loader-circle class="size-6 animate-spin text-accent" />
    </div>

    <h2 class="mt-5 text-xl font-semibold">
      Waiting for your first pipeline
    </h2>
    <p class="mt-2 text-sm text-dim">
      PipeMind is connected to
      <span class="font-medium text-fg">{{ projects.map(p => p.name).join(', ') }}</span>
      and listening. Push a commit, or run a pipeline manually.
    </p>

    <button
      class="group mt-5 flex w-full items-center gap-3 rounded-[var(--pm-radius)] border bg-[var(--pm-surface-2)] px-3.5 py-3 text-left font-mono text-[12px] text-dim transition-colors hover:border-[color:var(--pm-accent)]/40"
      @click="copy"
    >
      <span class="min-w-0 flex-1 truncate">$ {{ command }}</span>
      <i
        :class="copied ? 'i-lucide-check text-accent' : 'i-lucide-copy text-mute'"
        class="size-3.5 shrink-0"
      />
    </button>

    <dl class="mt-5 divide-y rounded-[var(--pm-radius)] border text-left text-[13px]">
      <div class="flex items-center justify-between px-3.5 py-2.5">
        <dt class="text-dim">Webhook endpoint</dt>
        <dd class="flex items-center gap-1.5 text-accent">
          <i-lucide-check class="size-3.5" />registered
        </dd>
      </div>
      <div class="flex items-center justify-between px-3.5 py-2.5">
        <dt class="text-dim">First pipeline</dt>
        <dd class="text-mute">{{ arrived ? 'received' : 'none yet' }}</dd>
      </div>
      <div class="flex items-center justify-between px-3.5 py-2.5">
        <dt class="text-dim">Listening since</dt>
        <dd class="text-mute">{{ since.toLocaleTimeString() }}</dd>
      </div>
    </dl>

    <PmButton variant="ghost" size="sm" class="mt-6" @click="emit('skip')">
      Skip to dashboard
    </PmButton>
  </div>
</template>
