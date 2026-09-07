<script setup lang="ts">
const props = defineProps<{ password: string }>()

/**
 * Feedback, not a gate.
 *
 * The server enforces the minimum; this only tells the user where they stand.
 * A meter that blocks submission on its own guess would reject passphrases that
 * are genuinely strong but score badly on naive heuristics.
 */
const checks = computed(() => [
  { label: 'At least 8 characters', met: props.password.length >= 8 },
  { label: 'Upper and lower case', met: /[a-z]/.test(props.password) && /[A-Z]/.test(props.password) },
  { label: 'A number or symbol', met: /[\d\W]/.test(props.password) },
  { label: '12 characters or more', met: props.password.length >= 12 },
])

const score = computed(() => checks.value.filter(c => c.met).length)

const label = computed(() =>
  ['', 'Weak', 'Fair', 'Good', 'Strong'][score.value] ?? '')

const tone = computed(() =>
  score.value >= 4
    ? 'var(--pm-accent)'
    : score.value >= 3 ? 'var(--pm-success)' : score.value >= 2 ? 'var(--pm-warning)' : 'var(--pm-danger)')
</script>

<template>
  <div v-if="password" class="mt-2">
    <div class="flex items-center gap-2">
      <div class="flex h-1 flex-1 gap-1">
        <span
          v-for="step in 4"
          :key="step"
          class="flex-1 rounded-full transition-colors"
          :style="{ background: step <= score ? tone : 'var(--pm-surface-3)' }"
        />
      </div>
      <span class="text-[11px] font-medium" :style="{ color: tone }">{{ label }}</span>
    </div>

    <ul class="mt-2 grid grid-cols-2 gap-x-3 gap-y-1">
      <li
        v-for="check in checks"
        :key="check.label"
        class="flex items-center gap-1.5 text-[11px]"
        :class="check.met ? 'text-dim' : 'text-mute'"
      >
        <i
          :class="check.met ? 'i-lucide-check text-accent' : 'i-lucide-minus'"
          class="size-3 shrink-0"
        />
        {{ check.label }}
      </li>
    </ul>
  </div>
</template>
