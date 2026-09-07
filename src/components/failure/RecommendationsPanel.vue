<script setup lang="ts">
import type { Recommendation } from '@/types/api'

defineProps<{ items: Recommendation[] }>()
</script>

<template>
  <PmCard title="Recommended" :padded="false">
    <div v-if="items.length" class="space-y-2 px-5 pb-5">
      <RecommendationCard v-for="rec in items" :key="rec.uuid" :rec="rec" />
    </div>

    <p v-else class="px-5 pb-5 text-xs text-mute">
      No recommendations for this failure.
    </p>
  </PmCard>
</template>
