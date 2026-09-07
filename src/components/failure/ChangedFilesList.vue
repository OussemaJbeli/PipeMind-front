<script setup lang="ts">
import type { ChangedFile } from '@/types/api'

defineProps<{ files: ChangedFile[] }>()

const expanded = reactive(new Set<string>())

const CHANGE_TONE: Record<ChangedFile['change_type'], string> = {
  added: 'text-accent',
  modified: 'text-dim',
  deleted: 'text-[var(--pm-danger)]',
  renamed: 'text-dim',
  copied: 'text-dim',
}
</script>

<template>
  <div v-if="files.length">
    <p class="mb-2 text-[11px] font-semibold uppercase tracking-wider text-mute">
      Changed in this commit
    </p>

    <ul class="space-y-1">
      <li
        v-for="file in files"
        :key="file.path"
        class="flex flex-wrap items-center gap-2.5 rounded-[var(--pm-radius-sm)] px-2.5 py-1.5 text-[13px]"
      >
        <!-- Config and dependency files are flagged because they explain far more
             failures than source edits, and a reader scanning this list should see
             the likely culprit without reading every path. -->
        <i
          :class="file.is_config
            ? 'i-lucide-settings-2 text-[var(--pm-warning)]'
            : file.is_dependency
              ? 'i-lucide-package text-[var(--pm-warning)]'
              : 'i-lucide-file-text text-mute'"
          class="size-3.5 shrink-0"
        />

        <span class="min-w-0 flex-1 truncate font-mono text-[12px]" :class="CHANGE_TONE[file.change_type]">
          {{ file.path }}
        </span>

        <span class="shrink-0 font-mono text-[11px] text-mute">
          <span class="text-accent">+{{ file.additions }}</span>
          <span class="ml-1 text-[var(--pm-danger)]">−{{ file.deletions }}</span>
        </span>

        <PmBadge v-if="file.is_config" tone="warning" size="sm">config</PmBadge>
        <PmBadge v-else-if="file.is_dependency" tone="warning" size="sm">deps</PmBadge>

        <button
          v-if="file.patch"
          class="shrink-0 text-[11px] text-accent hover:underline"
          @click="expanded.has(file.path) ? expanded.delete(file.path) : expanded.add(file.path)"
        >
          {{ expanded.has(file.path) ? 'hide' : 'diff' }}
        </button>

        <!-- An OBSERVED fact: what the commit actually changed, not a
             suggestion. It belongs in the Observed panel for that reason. -->
        <PatchDiff
          v-if="file.patch && expanded.has(file.path)"
          :patch="file.patch"
          :truncated="file.patch_truncated"
          class="mt-2 w-full"
        />
      </li>
    </ul>
  </div>

  <p v-else class="text-xs text-mute">
    No file changes were recorded for this pipeline.
  </p>
</template>
