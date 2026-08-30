<template>
  <!-- Matches ProjectCard's layout exactly so nothing reflows when data lands. -->
  <PmCard :padded="false" class="flex flex-col">
    <div class="flex items-start gap-3 p-4 pb-3">
      <PmSkeleton class="size-11 shrink-0" rounded="var(--pm-radius)" />
      <div class="flex-1 space-y-2">
        <PmSkeleton class="h-4 w-28" />
        <PmSkeleton class="h-3 w-40" />
      </div>
    </div>

    <div class="grid grid-cols-[auto_1fr_1fr_1fr] items-center gap-3 px-4 pb-4">
      <PmSkeleton class="size-[54px]" rounded="9999px" />
      <div v-for="i in 3" :key="i" class="space-y-1.5">
        <PmSkeleton class="h-4 w-10" />
        <PmSkeleton class="h-3 w-16" />
      </div>
    </div>

    <div class="flex items-center justify-between border-t px-4 py-3">
      <PmSkeleton class="h-3 w-44" />
      <PmSkeleton class="h-8 w-28" rounded="var(--pm-radius)" />
    </div>
  </PmCard>
</template>
