<script setup lang="ts">
import type { CategorySlice } from '@/types/api'

defineProps<{ categories: CategorySlice[], slug: string }>()
</script>

<template>
  <PmCard title="Failure Categories" subtitle="Most common in this range" :padded="false">
    <template #actions>
      <RouterLink
        :to="{ name: 'project.overview', params: { slug } }"
        class="text-xs font-medium text-accent hover:underline"
      >
        View all
      </RouterLink>
    </template>

    <div class="px-5 pb-5">
      <PmCategoryBars
        v-if="categories.length"
        :items="categories"
        :link-to="(item) => ({
          name: 'project.overview',
          params: { slug },
          query: { category: item.category },
        })"
      />
      <PmEmptyState v-else compact icon="i-lucide-circle-check" title="No failures in this range" />
    </div>
  </PmCard>
</template>
