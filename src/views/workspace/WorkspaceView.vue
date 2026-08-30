<script setup lang="ts">
import { computed, ref } from 'vue'

import {
  useWorkspaceActivity,
  useWorkspaceProjects,
  useWorkspaceSummary,
} from '@/api/queries/workspace'
import { useUiStore } from '@/stores/ui'

const ui = useUiStore()

const { data: summary, isLoading: loadingSummary, error: summaryError } = useWorkspaceSummary()
const { data: projects, isLoading: loadingProjects } = useWorkspaceProjects()
const { data: activity } = useWorkspaceActivity(5)

const search = ref('')

const filtered = computed(() => {
  const query = search.value.trim().toLowerCase()

  if (!query)
    return projects.value ?? []

  return (projects.value ?? []).filter(project =>
    project.name.toLowerCase().includes(query)
    || project.tech_stack.some(tech => tech.toLowerCase().includes(query)),
  )
})
</script>

<template>
  <div class="mx-auto max-w-[1600px]">
    <WorkspaceGreeting subtitle="Here's what's happening across your workspace." />

    <KpiRow
      class="mt-6"
      :summary="summary"
      :loading="loadingSummary"
      :error="summaryError as any"
    />

    <div class="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_350px]">
      <section>
        <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 class="text-xl font-semibold">Your Projects</h2>

          <div class="flex items-center gap-2">
            <PmInput
              v-model="search"
              placeholder="Search projects…"
              icon="i-lucide-search"
              class="w-56"
            />
            <PmSegmented
              v-model="ui.projectViewMode"
              aria-label="Project view mode"
              :options="[
                { key: 'grid', icon: 'i-lucide-layout-grid' },
                { key: 'list', icon: 'i-lucide-list' },
              ]"
            />
          </div>
        </div>

        <ProjectGrid
          v-if="ui.projectViewMode === 'grid'"
          :projects="filtered"
          :loading="loadingProjects"
          :searching="Boolean(search.trim())"
        />
        <ProjectTable v-else :projects="filtered" :loading="loadingProjects" />
      </section>

      <ActivityPanel
        :items="activity"
        title="Recent Activity"
        :to="{ name: 'workspace' }"
        show-project
      />
    </div>
  </div>
</template>
