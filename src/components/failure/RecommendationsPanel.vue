<script setup lang="ts">
import type { Recommendation } from '@/types/api'

// slug is passed through so an applied recommendation can link to the
// remediation it created.
defineProps<{ items: Recommendation[], slug: string }>()
</script>

<template>
  <PmCard title="Recommended" :padded="false">
    <div v-if="items.length" class="space-y-2 px-5 pb-5">
      <RecommendationCard v-for="rec in items" :key="rec.uuid" :rec="rec" :slug="slug" />
    </div>

    <p v-else class="px-5 pb-5 text-xs text-mute">
      No recommendations for this failure.
    </p>
  </PmCard>
</template>
