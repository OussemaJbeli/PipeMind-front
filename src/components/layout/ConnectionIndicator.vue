<script setup lang="ts">
import { useConnectionStatus } from '@/composables/useEcho'

const { state, isLive, isSupported } = useConnectionStatus()
</script>

<template>
  <!--
    Hidden entirely when Reverb is not configured. A permanent "disconnected"
    badge on a deployment that never had WebSockets would report a fault that
    does not exist — polling is a supported configuration, not a degraded one.
  -->
  <PmTooltip
    v-if="isSupported"
    :content="isLive
      ? 'Live — updates arrive as they happen'
      : 'Reconnecting — showing cached data, refreshing on a timer'"
  >
    <span class="flex items-center gap-1.5 text-[11px] text-mute">
      <span
        class="size-1.5 rounded-full"
        :class="state === 'connecting' && 'animate-pulse'"
        :style="{
          background: isLive
            ? 'var(--pm-success)'
            : state === 'connecting' ? 'var(--pm-warning)' : 'var(--pm-text-mute)',
        }"
      />
      <span class="hidden sm:inline">{{ isLive ? 'Live' : 'Reconnecting' }}</span>
    </span>
  </PmTooltip>
</template>
