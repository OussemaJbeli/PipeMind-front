<script setup lang="ts">
import { useRoute } from 'vue-router'

import {
  useAnalyseFailure,
  useFailure,
  useIgnoreFailure,
  useResolveFailure,
  useSubmitFeedback,
} from '@/api/queries/failures'
import type { ApiError } from '@/api/client'
import type { AnalysisFeedbackPayload, ResolutionType } from '@/types/api'

const route = useRoute()

const uuid = computed(() => String(route.params.uuid))
const slug = computed(() => String(route.params.slug))

const { data: failure, isPending, isError, error, refetch } = useFailure(uuid)

const analyse = useAnalyseFailure()
const resolve = useResolveFailure()
const ignore = useIgnoreFailure()
const feedback = useSubmitFeedback(uuid)

const resolving = ref(false)

const busy = computed(() =>
  analyse.isPending.value || resolve.isPending.value || ignore.isPending.value,
)

function reanalyse() {
  // force: the user is asking for a fresh answer, so neither the cache nor a
  // stored analysis should satisfy it.
  analyse.mutate({ uuid: uuid.value, force: true })
}

function submitFeedback(payload: AnalysisFeedbackPayload) {
  const analysisUuid = failure.value?.analysis?.uuid

  if (analysisUuid)
    feedback.mutate({ analysisUuid, ...payload })
}

function confirmResolve(payload: { resolution_type: ResolutionType, resolution_note?: string }) {
  resolve.mutate({ uuid: uuid.value, ...payload }, { onSuccess: () => (resolving.value = false) })
}

</script>

<template>
  <div class="mx-auto max-w-[1500px]">
    <PmAsyncBoundary :loading="isPending" :error="isError ? (error as unknown as ApiError) : null" @retry="refetch">
      <template #loading>
        <div class="space-y-5">
          <PmSkeleton class="h-28" />
          <div class="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div class="space-y-5">
              <PmSkeleton class="h-72" />
              <PmSkeleton class="h-64" />
            </div>
            <PmSkeleton class="h-96" />
          </div>
        </div>
      </template>

      <template v-if="failure" #default>
        <FailureHeader
          :failure="failure"
          :busy="busy"
          @resolve="resolving = true"
          @ignore="ignore.mutate(uuid)"
          @reanalyse="reanalyse"
        />

        <div class="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div class="space-y-5">
            <!-- FACTS -->
            <ObservedPanel :failure="failure" />

            <!-- INFERENCE -->
            <AnalysisPanel
              :analysis="failure.analysis"
              :status="failure.status"
              :slug="slug"
              :feedback-pending="feedback.isPending.value"
              @feedback="submitFeedback"
              @retry="reanalyse"
            />
          </div>

          <aside class="space-y-5">
            <SimilarFailuresPanel :items="failure.similar_failures" :slug="slug" />
            <RecommendationsPanel :items="failure.recommendations" />
            <FailureMetaPanel :failure="failure" />
          </aside>
        </div>
      </template>
    </PmAsyncBoundary>

    <ResolveDialog
      :open="resolving"
      :pending="resolve.isPending.value"
      @close="resolving = false"
      @confirm="confirmResolve"
    />
  </div>
</template>
