<script setup lang="ts">
import { useRouter } from 'vue-router'

import { useRelativeTime } from '@/composables/useRelativeTime'
import type { PipelineListItem } from '@/types/api'

const props = defineProps<{ pipelines: PipelineListItem[], slug: string }>()

const router = useRouter()

/**
 * A failed row routes to the FAILURE, not the pipeline: the user's next question
 * is "why", and the failure page answers it directly. Sending them to the
 * pipeline page to click once more is a wasted step in the most common path.
 */
function open(pipeline: PipelineListItem) {
  if (pipeline.has_failure && pipeline.failure_uuid) {
    router.push({
      name: 'project.failure',
      params: { slug: props.slug, uuid: pipeline.failure_uuid },
    })

    return
  }

  router.push({
    name: 'project.overview',
    params: { slug: props.slug },
    query: { pipeline: String(pipeline.iid) },
  })
}
</script>

<template>
  <PmCard title="Recent Pipelines" :padded="false">
    <template #actions>
      <RouterLink
        :to="{ name: 'project.pipelines', params: { slug } }"
        class="text-xs font-medium text-accent hover:underline"
      >
        View all
      </RouterLink>
    </template>

    <div class="overflow-x-auto">
      <table class="w-full text-[13px]">
        <thead>
          <tr class="border-b text-[10px] uppercase tracking-wider text-mute">
            <th class="px-5 py-2 text-left font-medium">Pipeline</th>
            <th class="px-2 py-2 text-left font-medium">Status</th>
            <th class="px-2 py-2 text-left font-medium">Branch</th>
            <th class="px-2 py-2 text-right font-medium">Duration</th>
            <th class="px-5 py-2 text-right font-medium">Finished</th>
          </tr>
        </thead>

        <tbody class="divide-y">
          <tr
            v-for="pipeline in pipelines"
            :key="pipeline.uuid"
            class="cursor-pointer transition-colors hover:bg-surface-2"
            @click="open(pipeline)"
          >
            <td class="px-5 py-2.5">
              <span class="flex items-center gap-1.5 font-medium">
                <ProviderIcon :provider="pipeline.provider" class="size-3.5 shrink-0" />
                #{{ pipeline.iid }}
              </span>
            </td>
            <td class="px-2 py-2.5">
              <PmStatusPill :status="pipeline.status" size="sm" />
            </td>
            <td class="max-w-[140px] truncate px-2 py-2.5 text-dim">{{ pipeline.ref }}</td>
            <td class="px-2 py-2.5 text-right tnum text-dim">
              {{ pipeline.duration_display ?? '—' }}
            </td>
            <td class="px-5 py-2.5 text-right text-mute">
              {{ useRelativeTime(() => pipeline.finished_at).value }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <PmEmptyState v-if="!pipelines.length" compact title="No pipelines in this range" />
  </PmCard>
</template>
