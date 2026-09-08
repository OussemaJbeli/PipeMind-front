<script setup lang="ts">
import { useToasts, type ToastTone } from '@/composables/useToasts'

const { toasts, dismiss } = useToasts()

const TONES: Record<ToastTone, { color: string, icon: string }> = {
  info: { color: 'var(--pm-info)', icon: 'i-lucide-info' },
  success: { color: 'var(--pm-success)', icon: 'i-lucide-circle-check' },
  warning: { color: 'var(--pm-warning)', icon: 'i-lucide-triangle-alert' },
  danger: { color: 'var(--pm-danger)', icon: 'i-lucide-circle-alert' },
}
</script>

<template>
  <Teleport to="body">
    <!--
      aria-live so a screen reader announces a failure that arrives while the
      user is elsewhere on the page — the whole point of these is that nobody
      was looking.
    -->
    <div
      class="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-[min(380px,calc(100vw-2rem))] flex-col gap-2"
      role="status"
      aria-live="polite"
    >
      <TransitionGroup
        enter-from-class="translate-y-2 opacity-0"
        enter-active-class="transition duration-200"
        leave-to-class="translate-x-2 opacity-0"
        leave-active-class="transition duration-150"
      >
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="pointer-events-auto rounded-[var(--pm-radius)] border bg-surface p-3 shadow-lg"
          :style="{ borderLeftColor: TONES[toast.tone].color, borderLeftWidth: '3px' }"
        >
          <div class="flex items-start gap-2.5">
            <i
              :class="TONES[toast.tone].icon"
              class="mt-0.5 size-4 shrink-0"
              :style="{ color: TONES[toast.tone].color }"
            />

            <div class="min-w-0 flex-1">
              <p class="text-[13px] font-medium leading-snug">{{ toast.title }}</p>
              <p v-if="toast.description" class="mt-0.5 line-clamp-2 text-xs text-dim">
                {{ toast.description }}
              </p>

              <button
                v-if="toast.action"
                class="mt-1.5 text-xs font-medium text-accent underline-offset-2 hover:underline"
                @click="toast.action.run(); dismiss(toast.id)"
              >
                {{ toast.action.label }}
              </button>
            </div>

            <button
              class="shrink-0 rounded p-0.5 text-mute transition-colors hover:text-fg"
              aria-label="Dismiss"
              @click="dismiss(toast.id)"
            >
              <i-lucide-x class="size-3.5" />
            </button>
          </div>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>
