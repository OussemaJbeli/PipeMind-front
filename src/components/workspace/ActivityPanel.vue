<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'

import type { ActivityItem as Item } from '@/types/api'

withDefaults(defineProps<{
  items: Item[] | undefined
  title?: string
  to?: RouteLocationRaw
  showProject?: boolean
}>(), { title: 'Recent Activity' })
</script>

<template>
  <PmCard :padded="false" class="self-start">
    <template #header>
      <div class="flex w-full items-center justify-between px-4 pb-3 pt-4">
        <h3 class="text-[15px] font-semibold">{{ title }}</h3>
        <RouterLink
          v-if="to"
          :to="to"
          class="text-xs font-medium text-accent hover:underline"
        >
          View all
        </RouterLink>
      </div>
    </template>

    <div class="divide-y">
      <template v-if="items === undefined">
        <div v-for="i in 5" :key="i" class="flex gap-3 px-4 py-3">
          <PmSkeleton class="size-8 shrink-0" rounded="9999px" />
          <div class="flex-1 space-y-2">
            <PmSkeleton class="h-3 w-24" />
            <PmSkeleton class="h-3 w-full" />
          </div>
        </div>
      </template>

      <template v-else-if="items.length">
        <ActivityItem
          v-for="item in items"
          :key="item.uuid"
          :item="item"
          :show-project="showProject"
        />
      </template>

      <PmEmptyState v-else compact icon="i-lucide-activity" title="No activity yet" />
    </div>

    <div v-if="to && items?.length" class="p-3">
      <PmButton variant="outline" block size="sm" @click="$router.push(to)">
        View all activity
      </PmButton>
    </div>
  </PmCard>
</template>
