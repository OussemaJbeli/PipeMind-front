<script setup lang="ts">
import { computed } from 'vue'

import { useProjectOverview } from '@/api/queries/project'
import type { ApiError } from '@/api/client'
import type { RangeKey } from '@/types/domain'

const props = defineProps<{ slug: string }>()

const range = useRouteQuery<RangeKey>('range', '7d')

const { data, isLoading, isFetching, error, refetch } = useProjectOverview(
  () => props.slug,
  range,
)

// Dim the board while a range change refetches, rather than blanking it out.
const stale = computed(() => isFetching.value && !isLoading.value)
</script>

<template>
  <div class="mx-auto max-w-[1700px]">
    <ProjectPageHeader
      v-model:range="range"
      title="Overview"
      :refreshing="isFetching"
      @refresh="refetch()"
    />

    <PmAsyncBoundary
      :loading="isLoading"
      :error="(error as ApiError | null)"
      @retry="refetch()"
    >
      <template #loading>
        <div class="mt-5 space-y-5">
          <PmSkeleton class="h-16 w-72" />
          <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
            <PmSkeleton v-for="i in 5" :key="i" class="h-[148px]" rounded="var(--pm-radius-lg)" />
          </div>
          <div class="grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1.1fr)]">
            <PmSkeleton v-for="i in 3" :key="i" class="h-[300px]" rounded="var(--pm-radius-lg)" />
          </div>
        </div>
      </template>

      <template v-if="data">
        <ProjectGreeting :project-name="data.project.name" class="mt-5" />

        <div class="transition-opacity duration-200" :class="stale && 'opacity-60'">
          <ProjectKpiRow :kpis="data.kpis" class="mt-6" />

          <!-- row 1 -->
          <div class="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1.1fr)]">
            <PipelineActivityChart :chart="data.activity_chart" />
            <FailureBreakdownCard :breakdown="data.failure_breakdown" :slug="slug" />
            <AiInsightCard :insight="data.insight" :slug="slug" />
          </div>

          <!-- row 2 -->
          <div class="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)_minmax(0,1.1fr)]">
            <TopCategoriesCard :categories="data.top_categories" :slug="slug" />
            <RecentPipelinesCard :pipelines="data.recent_pipelines" :slug="slug" />
            <ActivityPanel
              :items="data.recent_activity"
              title="Recent Activity"
              :to="{ name: 'project.overview', params: { slug } }"
            />
          </div>

          <!-- row 3 -->
          <SuccessRateCard :chart="data.success_rate_chart" class="mt-5" />
        </div>
      </template>
    </PmAsyncBoundary>
  </div>
</template>
