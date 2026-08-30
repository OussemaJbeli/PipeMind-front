<script setup lang="ts">
import { computed } from 'vue'

import { projectIcon } from '@/composables/useProjectIcon'
import { useRelativeTime } from '@/composables/useRelativeTime'
import { HEALTH_COLOR, PIPELINE_STATUS_META } from '@/composables/useStatusMeta'
import type { ProjectCard as Project } from '@/types/api'

const props = defineProps<{ project: Project }>()

const lastStatus = computed(() =>
  props.project.last_pipeline
    ? PIPELINE_STATUS_META[props.project.last_pipeline.status]
    : null)

const lastRelative = useRelativeTime(() => props.project.last_pipeline?.finished_at)

const HEALTH_LABEL = {
  healthy: 'Healthy',
  degraded: 'Degraded — success rate below 90%',
  failing: 'Failing — the last pipeline failed',
  unknown: 'No pipelines yet',
} as const
</script>

<template>
  <PmCard hoverable :padded="false" class="flex flex-col">
    <!-- header -->
    <div class="flex items-start gap-3 p-4 pb-3">
      <PmIconTile :icon="projectIcon(project.icon)" :color="project.color" />

      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-2">
          <h3 class="truncate text-[15px] font-semibold">{{ project.name }}</h3>

          <!--
            Separate from success_rate on purpose: success rate is a 30-day
            average, the dot is right now. A project at 98% whose last pipeline
            just failed must not read green.
          -->
          <PmTooltip :content="HEALTH_LABEL[project.health_status]">
            <span
              class="size-2 shrink-0 rounded-full"
              :style="{ background: HEALTH_COLOR[project.health_status] }"
              role="img"
              :aria-label="HEALTH_LABEL[project.health_status]"
            />
          </PmTooltip>
        </div>

        <p class="mt-0.5 truncate text-xs text-dim">{{ project.tech_stack.join(' · ') }}</p>
      </div>

      <ProjectCardMenu :project="project" />
    </div>

    <!-- metrics -->
    <div class="grid grid-cols-[auto_1fr_1fr_1fr] items-center gap-3 px-4 pb-4">
      <PmRadialGauge :value="project.success_rate" :size="54" />

      <div>
        <p class="text-[15px] font-semibold tnum">{{ project.success_rate.toFixed(0) }}%</p>
        <p class="text-[11px] text-dim">Success rate</p>
      </div>

      <div>
        <!-- Red only when > 0: a red zero trains people to ignore red. -->
        <p
          class="text-[15px] font-semibold tnum"
          :class="project.failures_today > 0 ? 'text-[var(--pm-danger)]' : 'text-fg'"
        >
          {{ project.failures_today }}
        </p>
        <p class="text-[11px] text-dim">Failures today</p>
      </div>

      <div>
        <p class="text-[15px] font-semibold tnum">{{ project.pipelines_count }}</p>
        <p class="text-[11px] text-dim">Pipelines</p>
      </div>
    </div>

    <!-- footer -->
    <div class="mt-auto flex items-center justify-between gap-3 border-t px-4 py-3">
      <p class="flex min-w-0 items-center gap-1.5 truncate text-xs text-dim">
        <template v-if="project.last_pipeline && lastStatus">
          <span class="shrink-0">Last pipeline:</span>
          <span class="shrink-0 font-medium text-fg">#{{ project.last_pipeline.iid }}</span>
          <span class="inline-flex shrink-0 items-center gap-1" :style="{ color: lastStatus.color }">
            <i :class="lastStatus.icon" class="size-3" />{{ lastStatus.label }}
          </span>
          <span class="truncate text-mute">{{ lastRelative }}</span>
        </template>
        <template v-else>No pipelines yet</template>
      </p>

      <!--
        The card is not itself a link: it contains a menu button and a tooltip,
        and nesting interactive elements inside an anchor breaks keyboard nav.
      -->
      <PmButton
        variant="outline"
        size="sm"
        class="shrink-0"
        @click="$router.push({ name: 'project.overview', params: { slug: project.slug } })"
      >
        Open Project <i-lucide-chevron-right class="size-3.5" />
      </PmButton>
    </div>
  </PmCard>
</template>
