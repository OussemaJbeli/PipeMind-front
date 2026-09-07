<script setup lang="ts">
import { useStorage } from '@vueuse/core'

import type { ApiError } from '@/api/client'
import { useWorkspaceProjects } from '@/api/queries/workspace'

const { data: projects, isPending, isError, error, refetch } = useWorkspaceProjects()

const search = ref('')
const health = ref('')
const provider = ref('')
const view = useStorage('pm.projects.view', 'grid')

const filtered = computed(() => {
  const term = search.value.trim().toLowerCase()

  return (projects.value ?? []).filter((project) => {
    if (health.value && project.health_status !== health.value)
      return false

    if (provider.value && project.provider !== provider.value)
      return false

    if (!term)
      return true

    // Tech stack included: "which of our Laravel projects is failing" is a real
    // question, and the answer is not in the name.
    return project.name.toLowerCase().includes(term)
      || project.slug.toLowerCase().includes(term)
      || (project.tech_stack ?? []).some(tech => tech.toLowerCase().includes(term))
  })
})

const providerOptions = computed(() => [
  { key: '', label: 'All providers' },
  ...[...new Set((projects.value ?? []).map(p => p.provider).filter(Boolean))]
    .map(p => ({ key: p as string, label: p as string })),
])

const HEALTH = [
  { key: '', label: 'Any health' },
  { key: 'healthy', label: 'Healthy' },
  { key: 'degraded', label: 'Degraded' },
  { key: 'failing', label: 'Failing' },
  { key: 'unknown', label: 'Unknown' },
]
</script>

<template>
  <div class="mx-auto max-w-[1500px]">
    <div class="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 class="text-xl font-semibold">Projects</h1>
        <p class="mt-1 text-sm text-dim">
          {{ filtered.length }} of {{ projects?.length ?? 0 }} monitored
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <PmInput v-model="search" placeholder="Search name or stack…" icon="i-lucide-search" size="sm" />
        <PmSelect v-model="provider" :options="providerOptions" size="sm" />
        <PmSelect v-model="health" :options="HEALTH" size="sm" />
        <PmSegmented
          v-model="view"
          :options="[{ key: 'grid', icon: 'i-lucide-layout-grid' }, { key: 'list', icon: 'i-lucide-list' }]"
          size="sm"
        />
      </div>
    </div>

    <PmAsyncBoundary
      :loading="isPending"
      :error="isError ? (error as unknown as ApiError) : null"
      :empty="!filtered.length"
      empty-title="No projects match"
      :empty-message="projects?.length
        ? 'Try clearing the filters.'
        : 'Import a repository from an integration to start monitoring it.'"
      @retry="refetch"
    >
      <ProjectGrid v-if="view === 'grid'" :projects="filtered" />
      <ProjectTable v-else :projects="filtered" />
    </PmAsyncBoundary>
  </div>
</template>
