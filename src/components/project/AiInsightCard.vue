<script setup lang="ts">
import { useRouter } from 'vue-router'

import type { ProjectInsight } from '@/types/api'

const props = defineProps<{ insight: ProjectInsight | null, slug: string }>()

const router = useRouter()

function investigate() {
  if (!props.insight?.action)
    return

  // Routes for the other project sections land in file 16; until then the
  // action resolves to the overview rather than throwing.
  router.push({
    name: 'project.overview',
    params: { slug: props.slug },
    query: props.insight.action.params as Record<string, string>,
  })
}

/** Emphasise the numbers — that is what the reader is scanning for. */
function highlightNumbers(text: string): string {
  return text.replace(
    /(\d+(?:\.\d+)?[%x×]?)/g,
    '<span class="font-semibold text-fg">$1</span>',
  )
}
</script>

<template>
  <PmCard v-if="insight" glow :padded="false" class="overflow-hidden">
    <div class="relative p-5">
      <NeuralGraphic
        class="pointer-events-none absolute -right-4 top-1/2 size-[150px] -translate-y-1/2 opacity-70"
        aria-hidden="true"
      />

      <div class="relative max-w-[64%]">
        <div class="flex items-center gap-2">
          <i-lucide-sparkles class="size-4 text-accent" />
          <h3 class="text-[15px] font-semibold">AI Insight</h3>
        </div>

        <!-- eslint-disable-next-line vue/no-v-html -- server-generated, no user input -->
        <p class="mt-3 text-[13px] leading-relaxed text-dim" v-html="highlightNumbers(insight.headline)" />

        <p v-if="insight.detail" class="mt-1.5 text-[13px] leading-relaxed text-dim">
          {{ insight.detail }}
        </p>

        <PmButton variant="primary" size="sm" class="mt-4" @click="investigate">
          {{ insight.action?.label ?? 'Investigate' }}
        </PmButton>
      </div>
    </div>
  </PmCard>

  <!--
    No insight is a legitimate, positive state. Say so rather than hiding the
    card and leaving a hole in the grid.
  -->
  <PmCard v-else class="grid place-items-center text-center">
    <div class="py-6">
      <i-lucide-sparkles class="mx-auto size-6 text-mute" />
      <p class="mt-3 text-[13px] font-medium">No patterns detected</p>
      <p class="mt-1 text-xs text-dim">
        PipeMind hasn't found anything unusual in this range.
      </p>
    </div>
  </PmCard>
</template>
