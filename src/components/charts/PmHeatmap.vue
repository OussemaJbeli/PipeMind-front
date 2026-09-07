<script setup lang="ts">
const props = defineProps<{
  /** cells[isoDayOfWeek 1-7][hour 0-23] */
  cells: Record<string, Record<string, number>>
  max: number
  label?: string
}>()

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

// Every third hour: a 24-column axis at this size is unreadable, and the gaps
// are still legible because the grid itself is regular.
const HOUR_TICKS = [0, 3, 6, 9, 12, 15, 18, 21]

function value(day: number, hour: number) {
  return props.cells?.[String(day)]?.[String(hour)] ?? 0
}

/**
 * Intensity, not a rainbow.
 *
 * A single hue varying in opacity reads as "more or less of the same thing",
 * which is what a density map means. Multiple hues would imply categories that
 * do not exist here.
 */
function shade(count: number) {
  if (!count)
    return 'var(--pm-surface-2)'

  const intensity = props.max > 0 ? Math.min(1, count / props.max) : 0

  // Floor at 0.15 so a single failure is still visible against the empty grid.
  return `color-mix(in srgb, var(--pm-danger) ${Math.round((0.15 + intensity * 0.85) * 100)}%, var(--pm-surface-2))`
}

const total = computed(() =>
  DAYS.reduce((sum, _, index) =>
    sum + Array.from({ length: 24 }, (_, hour) => value(index + 1, hour)).reduce((a, b) => a + b, 0), 0),
)
</script>

<template>
  <div>
    <div v-if="total === 0" class="py-8 text-center text-xs text-mute">
      No failures in this range.
    </div>

    <div v-else class="overflow-x-auto">
      <table class="w-full border-separate border-spacing-[2px]">
        <caption class="sr-only">
          {{ label ?? 'Failures by day of week and hour of day' }}
        </caption>

        <thead>
          <tr>
            <th scope="col" class="w-[34px]" />
            <th
              v-for="hour in 24"
              :key="hour"
              scope="col"
              class="text-[9px] font-normal text-mute"
            >
              {{ HOUR_TICKS.includes(hour - 1) ? String(hour - 1).padStart(2, '0') : '' }}
            </th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="(day, index) in DAYS" :key="day">
            <th scope="row" class="pr-1 text-right text-[10px] font-normal text-mute">
              {{ day }}
            </th>
            <td v-for="hour in 24" :key="hour" class="p-0">
              <PmTooltip :content="`${day} ${String(hour - 1).padStart(2, '0')}:00 — ${value(index + 1, hour - 1)} failure(s)`">
                <span
                  class="block h-4 rounded-[2px]"
                  :style="{ background: shade(value(index + 1, hour - 1)) }"
                />
              </PmTooltip>
            </td>
          </tr>
        </tbody>
      </table>

      <div class="mt-2 flex items-center justify-end gap-1.5 text-[10px] text-mute">
        <span>less</span>
        <span
          v-for="step in [0, 0.25, 0.5, 0.75, 1]"
          :key="step"
          class="size-3 rounded-[2px]"
          :style="{ background: shade(step * max) }"
        />
        <span>more</span>
      </div>
    </div>
  </div>
</template>
