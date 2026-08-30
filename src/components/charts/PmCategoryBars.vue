<script setup lang="ts">
import type { CategorySlice } from '@/types/api'
import { categoryMeta } from '@/composables/useCategoryMeta'

defineProps<{ items: CategorySlice[], linkTo?: (item: CategorySlice) => any }>()
</script>

<template>
  <ul class="space-y-3">
    <li v-for="item in items" :key="item.category">
      <component
        :is="linkTo ? 'RouterLink' : 'div'"
        :to="linkTo?.(item)"
        class="flex items-center gap-3"
        :class="linkTo && 'group cursor-pointer'"
      >
        <!--
          The icon class is owned by the frontend. The API sends a bare Lucide
          name ("flask-conical") from the PHP enum, which is not a usable class —
          and prefixing it at the call site would silently produce an empty tile
          the moment the backend adds a category.
        -->
        <PmIconTile
          :icon="categoryMeta(item.category).icon"
          :color="item.color"
          size="sm"
        />

        <span
          class="w-[92px] shrink-0 truncate text-[13px]"
          :class="item.count === 0 ? 'text-mute' : 'text-fg'"
        >{{ item.label }}</span>

        <div class="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-surface-3">
          <div
            class="h-full rounded-full transition-[width] duration-500"
            :style="{ width: `${item.percentage}%`, background: item.color }"
          />
        </div>

        <span class="w-[62px] shrink-0 text-right text-xs tnum text-dim">
          {{ item.count }} ({{ item.percentage.toFixed(0) }}%)
        </span>
      </component>
    </li>
  </ul>
</template>
