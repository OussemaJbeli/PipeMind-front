<script setup lang="ts">
import { PROVIDERS } from './providerCatalog'
import type { ProviderType } from '@/types/domain'

const model = defineModel<ProviderType | null>({ required: true })
</script>

<template>
  <div class="grid gap-3 sm:grid-cols-2">
    <button
      v-for="provider in PROVIDERS"
      :key="provider.key"
      :disabled="!provider.available"
      class="flex items-start gap-3 rounded-[var(--pm-radius-lg)] border p-4 text-left transition-colors disabled:opacity-40"
      :class="model === provider.key
        ? 'border-[color:var(--pm-accent)] bg-[var(--pm-accent-dim)]'
        : 'hover:border-[var(--pm-text-mute)] hover:bg-surface-2'"
      @click="model = provider.key"
    >
      <PmIconTile :icon="provider.icon" :color="provider.color" />

      <span class="min-w-0 flex-1">
        <span class="flex items-center gap-2">
          <span class="text-[15px] font-semibold">{{ provider.label }}</span>
          <i-lucide-check
            v-if="model === provider.key"
            class="size-4 shrink-0 text-accent"
          />
        </span>
        <span class="mt-1 block text-xs leading-relaxed text-dim">{{ provider.blurb }}</span>
      </span>
    </button>
  </div>
</template>
