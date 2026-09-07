<script setup lang="ts">
import type { ResolutionType } from '@/types/api'

defineProps<{ open: boolean, pending?: boolean }>()

const emit = defineEmits<{
  close: []
  confirm: [{ resolution_type: ResolutionType, resolution_note?: string }]
}>()

const type = ref<string>('fixed')
const note = ref('')

/**
 * The note is what a future reader — or the next analysis — actually learns from.
 *
 * A signature marked resolved with no explanation short-circuits later failures
 * to an answer nobody wrote down, so the field is prominent rather than optional-looking.
 */
const TYPES = [
  { key: 'fixed', label: 'Fixed — a code or config change resolved it' },
  { key: 'retried', label: 'Retried — it passed on a re-run' },
  { key: 'flaky', label: 'Flaky — the test itself is unreliable' },
  { key: 'auto_remediated', label: 'Auto-remediated' },
  { key: 'ignored', label: 'Ignored — not worth acting on' },
]

function confirm() {
  emit('confirm', {
    resolution_type: type.value as ResolutionType,
    resolution_note: note.value.trim() || undefined,
  })
}
</script>

<template>
  <div
    v-if="open"
    class="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"
    role="dialog"
    aria-modal="true"
    aria-label="Mark failure resolved"
    @click.self="$emit('close')"
  >
    <PmCard class="w-full max-w-md" title="Mark resolved">
      <div class="space-y-4">
        <PmSelect v-model="type" label="How was it resolved?" :options="TYPES" />

        <PmInput
          v-model="note"
          label="What fixed it?"
          placeholder="Restored the healthcheck-based depends_on in docker-compose.yml"
        />

        <p class="text-xs text-mute">
          This note is stored against the error signature. The next time PipeMind
          sees this exact failure it will lead with what you write here.
        </p>

        <div class="flex justify-end gap-2">
          <PmButton size="sm" variant="ghost" @click="$emit('close')">
            Cancel
          </PmButton>
          <PmButton size="sm" variant="primary" :loading="pending" @click="confirm">
            Mark resolved
          </PmButton>
        </div>
      </div>
    </PmCard>
  </div>
</template>
