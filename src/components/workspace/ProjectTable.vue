<script setup lang="ts">
import { useRelativeTime } from '@/composables/useRelativeTime'
import { HEALTH_COLOR } from '@/composables/useStatusMeta'
import type { ProjectCard as Project } from '@/types/api'

defineProps<{ projects: Project[], loading?: boolean }>()
</script>

<template>
  <PmCard :padded="false">
    <div class="overflow-x-auto">
      <table class="w-full text-[13px]">
        <thead>
          <tr class="border-b text-[10px] uppercase tracking-wider text-mute">
            <th class="px-4 py-2.5 text-left font-medium">Project</th>
            <th class="px-2 py-2.5 text-left font-medium">Stack</th>
            <th class="px-2 py-2.5 text-right font-medium">Success</th>
            <th class="px-2 py-2.5 text-right font-medium">Failures</th>
            <th class="px-2 py-2.5 text-right font-medium">Pipelines</th>
            <th class="px-4 py-2.5 text-right font-medium">Last run</th>
          </tr>
        </thead>

        <tbody class="divide-y">
          <tr
            v-for="project in projects"
            :key="project.uuid"
            class="cursor-pointer transition-colors hover:bg-surface-2"
            @click="$router.push({ name: 'project.overview', params: { slug: project.slug } })"
          >
            <td class="px-4 py-2.5">
              <span class="flex items-center gap-2 font-medium">
                <span
                  class="size-2 shrink-0 rounded-full"
                  :style="{ background: HEALTH_COLOR[project.health_status] }"
                />
                {{ project.name }}
              </span>
            </td>
            <td class="max-w-[220px] truncate px-2 py-2.5 text-dim">
              {{ project.tech_stack.join(' · ') }}
            </td>
            <td class="px-2 py-2.5 text-right tnum">{{ project.success_rate.toFixed(0) }}%</td>
            <td
              class="px-2 py-2.5 text-right tnum"
              :class="project.failures_today > 0 && 'text-[var(--pm-danger)]'"
            >
              {{ project.failures_today }}
            </td>
            <td class="px-2 py-2.5 text-right tnum text-dim">{{ project.pipelines_count }}</td>
            <td class="px-4 py-2.5 text-right text-mute">
              {{ useRelativeTime(() => project.last_pipeline?.finished_at).value }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <PmEmptyState v-if="!projects.length && !loading" compact title="No projects" />
  </PmCard>
</template>
