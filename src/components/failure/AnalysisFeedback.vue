<script setup lang="ts">
import { CATEGORY_META } from '@/composables/useCategoryMeta'
import type { Analysis, AnalysisFeedbackPayload } from '@/types/api'
import type { FailureCategory } from '@/types/domain'

const props = defineProps<{ analysis: Analysis, pending?: boolean }>()
const emit = defineEmits<{ submit: [AnalysisFeedbackPayload] }>()

/**
 * The most valuable widget in the application and the least impressive-looking.
 *
 * `correct_category` is the label column of the ML classifier's training set —
 * nothing else in PipeMind produces supervised labels. Which is why a thumbs-down
 * opens a form rather than just recording a vote: "this was wrong" teaches the
 * system nothing, "this was DOCKER, not DATABASE" teaches it everything.
 */
const correcting = ref(false)
const correctCategory = ref<string>('')
const actualRootCause = ref('')
const comment = ref('')

// "Not sure" first and default: forcing a guess would poison the training set
// with labels the user did not actually believe.
const categoryOptions = [
  { key: '', label: 'Not sure' },
  ...Object.entries(CATEGORY_META).map(([key, meta]) => ({ key, label: meta.label })),
]

function approve() {
  emit('submit', { was_helpful: true })
}

function openCorrection() {
  correcting.value = true
}

function submitCorrection() {
  emit('submit', {
    was_helpful: false,
    root_cause_correct: false,
    correct_category: (correctCategory.value || null) as FailureCategory | null,
    actual_root_cause: actualRootCause.value.trim() || null,
    comment: comment.value.trim() || null,
  })

  correcting.value = false
}

const given = computed(() => props.analysis.feedback.given)
</script>

<template>
  <div class="border-t pt-3">
    <!-- Already answered. Kept visible rather than hidden, so a user can see
         what they told PipeMind about this analysis. -->
    <p v-if="given && !correcting" class="flex items-center gap-2 text-xs text-dim">
      <i
        :class="analysis.feedback.was_helpful ? 'i-lucide-thumbs-up text-accent' : 'i-lucide-thumbs-down text-[var(--pm-warning)]'"
        class="size-3.5"
      />
      <span>
        You marked this analysis
        {{ analysis.feedback.was_helpful ? 'helpful' : 'unhelpful' }}.
      </span>
      <button class="text-accent underline-offset-2 hover:underline" @click="correcting = true">
        Change
      </button>
    </p>

    <div v-else-if="!correcting" class="flex items-center gap-2">
      <span class="text-xs text-mute">Was this helpful?</span>

      <PmButton size="sm" variant="ghost" :disabled="pending" aria-label="Helpful" @click="approve">
        <i-lucide-thumbs-up class="size-3.5" />
      </PmButton>

      <PmButton size="sm" variant="ghost" :disabled="pending" aria-label="Not helpful" @click="openCorrection">
        <i-lucide-thumbs-down class="size-3.5" />
      </PmButton>
    </div>

    <div v-else class="space-y-3">
      <p class="text-xs text-dim">
        What was actually wrong? Corrections here train PipeMind's classifier —
        this is the only place it learns from.
      </p>

      <PmSelect v-model="correctCategory" label="Correct category" :options="categoryOptions" />

      <PmInput
        v-model="actualRootCause"
        label="What actually caused it?"
        placeholder="The registry image tag no longer existed"
      />

      <PmInput v-model="comment" label="Anything else?" placeholder="Optional" />

      <div class="flex gap-2">
        <PmButton size="sm" variant="primary" :disabled="pending" @click="submitCorrection">
          Submit correction
        </PmButton>
        <PmButton size="sm" variant="ghost" @click="correcting = false">
          Cancel
        </PmButton>
      </div>
    </div>
  </div>
</template>
