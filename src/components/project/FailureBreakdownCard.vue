<script setup lang="ts">
import type { FailureBreakdown } from '@/types/api'

defineProps<{ breakdown: FailureBreakdown, slug: string }>()
</script>

<template>
  <PmCard title="Failure Breakdown" :padded="false">
    <template #actions>
      <RouterLink
        :to="{ name: 'project.overview', params: { slug } }"
        class="text-xs font-medium text-accent hover:underline"
      >
        View all
      </RouterLink>
    </template>

    <div class="flex items-center gap-5 px-5 pb-5">
      <PmDonutChart :items="breakdown.items">
        <p class="text-[26px] font-semibold leading-none tnum">{{ breakdown.total }}</p>
        <p class="text-[11px] text-dim">Total</p>
      </PmDonutChart>

      <!--
        Legend rows are filter links, not decoration. Clicking "Database 33% 1"
        goes to the failures list scoped to that category — which is what turns a
        chart into the entry point for the investigation workflow.
      -->
      <ul class="min-w-0 flex-1 space-y-2.5">
        <li v-for="item in breakdown.items" :key="item.category">
          <RouterLink
            :to="{
              name: 'project.failures',
              params: { slug },
              query: item.category === 'OTHER' ? {} : { category: item.category },
            }"
            class="flex items-center gap-2 text-[13px] transition-colors hover:text-fg"
            :class="item.count === 0 ? 'text-mute' : 'text-dim'"
          >
            <span class="size-2 shrink-0 rounded-full" :style="{ background: item.color }" />
            <span class="min-w-0 flex-1 truncate">{{ item.label }}</span>
            <span class="tnum">{{ item.percentage.toFixed(0) }}%</span>
            <span class="w-4 text-right font-medium tnum text-fg">{{ item.count }}</span>
          </RouterLink>
        </li>
      </ul>
    </div>
  </PmCard>
</template>
