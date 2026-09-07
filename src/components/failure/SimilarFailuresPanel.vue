<script setup lang="ts">
import type { SimilarFailure } from '@/types/api'

defineProps<{ items: SimilarFailure[], slug: string }>()
</script>

<template>
  <PmCard title="Similar failures" :padded="false">
    <div v-if="items.length" class="space-y-2 px-5 pb-5">
      <SimilarFailureItem v-for="item in items" :key="item.uuid" :item="item" :slug="slug" />
    </div>

    <!--
      Absence is stated, not left blank. An empty panel reads as "nothing
      matched" when it may equally mean "no history exists yet", and those two
      call for completely different reactions from the user.
    -->
    <p v-else class="px-5 pb-5 text-xs text-mute">
      Nothing similar in this workspace yet. As PipeMind sees more failures,
      matches will appear here.
    </p>
  </PmCard>
</template>
