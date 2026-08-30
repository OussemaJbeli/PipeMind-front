<script setup lang="ts">
import { useWorkspaceActivity, useWorkspaceProjects, useWorkspaceSummary } from '@/api/queries/workspace'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const { data: summary, isLoading: loadingSummary } = useWorkspaceSummary()
const { data: projects } = useWorkspaceProjects()
const { data: activity } = useWorkspaceActivity(5)
</script>

<template>
  <div class="mx-auto max-w-[1600px]">
    <h1 class="text-[26px] font-semibold leading-tight">
      Good evening, <span class="text-accent">{{ auth.user?.name?.split(' ')[0] }}</span>
    </h1>
    <p class="mt-1 text-sm text-dim">Here's what's happening across your workspace.</p>

    <!-- Scaffolding only — file 14 replaces this with the real KPI tiles. -->
    <div class="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <div
        v-for="(metric, key) in summary"
        :key="key"
        class="rounded-[var(--pm-radius-lg)] border bg-surface p-5"
      >
        <p class="text-[11px] font-medium uppercase tracking-wider text-dim">
          {{ String(key).replace(/_/g, ' ') }}
        </p>
        <p class="mt-1 text-[30px] font-semibold leading-none tnum">
          {{ metric.display ?? metric.value }}<span v-if="metric.unit" class="text-xl">{{ metric.unit }}</span>
        </p>
        <p v-if="metric.delta_label" class="mt-2 text-xs font-medium text-dim">
          {{ metric.delta_label }}
        </p>
      </div>

      <p v-if="loadingSummary" class="text-sm text-dim">Loading…</p>
    </div>

    <div class="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_350px]">
      <section>
        <h2 class="mb-4 text-xl font-semibold">Your Projects</h2>
        <div class="grid gap-4 md:grid-cols-2">
          <RouterLink
            v-for="project in projects"
            :key="project.uuid"
            :to="{ name: 'project.overview', params: { slug: project.slug } }"
            class="rounded-[var(--pm-radius-lg)] border bg-surface p-4 transition-colors hover:bg-surface-2"
          >
            <div class="flex items-center gap-2">
              <span class="text-[15px] font-semibold">{{ project.name }}</span>
              <span
                class="size-2 rounded-full"
                :style="{ background: project.health_status === 'failing' ? 'var(--pm-danger)' : project.health_status === 'degraded' ? 'var(--pm-warning)' : 'var(--pm-success)' }"
              />
            </div>
            <p class="mt-0.5 text-xs text-dim">{{ project.tech_stack.join(' · ') }}</p>
            <div class="mt-3 flex gap-6 text-[13px]">
              <span><b class="tnum">{{ project.success_rate }}%</b> <span class="text-dim">success</span></span>
              <span><b class="tnum" :class="project.failures_today > 0 && 'text-[var(--pm-danger)]'">{{ project.failures_today }}</b> <span class="text-dim">failures</span></span>
              <span><b class="tnum">{{ project.pipelines_count }}</b> <span class="text-dim">pipelines</span></span>
            </div>
          </RouterLink>
        </div>
      </section>

      <aside class="rounded-[var(--pm-radius-lg)] border bg-surface">
        <h3 class="px-4 pb-3 pt-4 text-[15px] font-semibold">Recent Activity</h3>
        <ul class="divide-y">
          <li v-for="item in activity" :key="item.uuid" class="px-4 py-3">
            <p class="text-[13px] font-medium">{{ item.title }}</p>
            <p class="mt-0.5 text-xs text-dim">{{ item.description }}</p>
          </li>
        </ul>
      </aside>
    </div>
  </div>
</template>
