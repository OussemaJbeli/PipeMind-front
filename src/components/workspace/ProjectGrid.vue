<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import type { ProjectCard as Project } from '@/types/api'

defineProps<{ projects: Project[], loading?: boolean, searching?: boolean }>()

const auth = useAuthStore()
</script>

<template>
  <div class="grid gap-4 md:grid-cols-2">
    <template v-if="loading">
      <ProjectCardSkeleton v-for="i in 4" :key="i" />
    </template>

    <template v-else-if="projects.length">
      <ProjectCard v-for="project in projects" :key="project.uuid" :project="project" />

      <button
        v-if="auth.can('projects.manage')"
        class="grid min-h-[132px] place-items-center rounded-[var(--pm-radius-lg)] border border-dashed text-dim transition-colors hover:border-[color:var(--pm-accent)]/50 hover:text-accent md:col-span-2"
        @click="$router.push({ name: 'workspace' })"
      >
        <span class="flex items-center gap-2 text-sm font-medium">
          <i-lucide-plus class="size-4" /> Add New Project
        </span>
      </button>
    </template>

    <!-- A filtered-to-nothing search is a different state from an empty workspace. -->
    <PmEmptyState
      v-else-if="searching"
      class="md:col-span-2"
      icon="i-lucide-search-x"
      title="No projects match your search"
      message="Try a different name or technology."
    />

    <PmEmptyState
      v-else
      class="md:col-span-2"
      icon="i-lucide-folder-open"
      title="No projects yet"
      message="Connect a CI/CD platform and import a repository to start monitoring."
    >
      <PmButton
        v-if="auth.can('projects.manage')"
        variant="primary"
        @click="$router.push({ name: 'workspace' })"
      >
        Connect CI/CD
      </PmButton>
    </PmEmptyState>
  </div>
</template>
