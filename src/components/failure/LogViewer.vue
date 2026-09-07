<script setup lang="ts">
import { useVirtualList } from '@vueuse/core'

import { useJobLog } from '@/api/queries/failures'

const props = withDefaults(defineProps<{
  jobUuid?: string
  /** Rendered immediately, so the panel is never empty while the request runs. */
  excerpt?: string | null
  startLine?: number | null
  /** Substring to highlight and scroll to — normally the extracted error line. */
  highlight?: string | null
}>(), { startLine: 1 })

const LINE_HEIGHT = 19
const VIEWPORT_HEIGHT = 420

const mode = ref<'excerpt' | 'full'>('excerpt')

// The full object is fetched only when asked for: a 48 000-line log has no
// business loading behind a collapsed panel.
const { data: log, isFetching } = useJobLog(
  computed(() => (mode.value === 'full' ? props.jobUuid : undefined)),
  'full',
)

interface Line { number: number, text: string, isError: boolean }

const lines = computed<Line[]>(() => {
  const source = mode.value === 'full' && log.value?.content
    ? log.value.content
    : props.excerpt ?? ''

  const offset = mode.value === 'full' ? 1 : (props.startLine ?? 1)
  const needle = props.highlight?.trim() ?? ''

  return source.split('\n').map((text, index) => ({
    number: offset + index,
    text,
    isError: needle.length > 0 && text.includes(needle),
  }))
})

/**
 * Virtualised: only the visible rows exist in the DOM.
 *
 * A full CI log runs to tens of thousands of lines, and rendering one table row
 * per line means ~100 000 DOM nodes — the tab stops responding long before the
 * user finds anything. With windowing the node count is bounded by the viewport,
 * so a 48 000-line log scrolls exactly as smoothly as a 30-line one.
 */
const { list, containerProps, wrapperProps, scrollTo } = useVirtualList(lines, {
  itemHeight: LINE_HEIGHT,
  overscan: 20,
})

const errorIndex = computed(() => lines.value.findIndex(line => line.isError))
const errorLine = computed(() => lines.value[errorIndex.value] ?? null)

/**
 * Land on the error, not the top.
 *
 * Opening a log at line 1 makes the reader scroll for the thing they came for.
 * The extracted error line is the reason this panel exists, so it is where the
 * viewport starts.
 */
async function jumpToError() {
  await nextTick()

  if (errorIndex.value >= 0) {
    // Centre it rather than pinning it to the top edge: the lines above an error
    // are usually what explains it.
    scrollTo(Math.max(0, errorIndex.value - Math.floor(VIEWPORT_HEIGHT / LINE_HEIGHT / 2)))
  }
}

onMounted(jumpToError)
watch([mode, lines], jumpToError)

const lineRange = computed(() => {
  const first = lines.value[0]
  const last = lines.value[lines.value.length - 1]

  return first && last ? `${first.number}–${last.number}` : null
})

const hasContent = computed(() => lines.value.some(line => line.text.length > 0))

const redactionSummary = computed(() => {
  const types = log.value?.redaction_types ?? []

  return types.length ? types.join(', ') : 'secrets'
})
</script>

<template>
  <div>
    <div class="mb-2 flex flex-wrap items-center justify-between gap-2">
      <p class="text-[11px] font-semibold uppercase tracking-wider text-mute">
        Log excerpt
        <span v-if="lineRange" class="ml-1 font-normal normal-case tracking-normal">
          lines {{ lineRange }}
        </span>
      </p>

      <div class="flex items-center gap-2">
        <!-- Redaction is stated, not silent. A log with secrets stripped and no
             notice looks like a corrupted log. -->
        <PmTooltip
          v-if="log?.is_redacted"
          :content="`${log.redaction_count} value(s) removed before storage: ${redactionSummary}`"
        >
          <PmBadge tone="warning" size="sm">
            redacted
          </PmBadge>
        </PmTooltip>

        <PmSegmented
          v-if="jobUuid"
          v-model="mode"
          :options="[
            { key: 'excerpt', label: 'Excerpt' },
            { key: 'full', label: 'Full log' },
          ]"
          size="sm"
        />
      </div>
    </div>

    <div class="rounded-[var(--pm-radius)] border bg-[var(--pm-surface-2)]">
      <p v-if="isFetching && mode === 'full'" class="p-4 text-xs text-mute">
        Loading the full log…
      </p>

      <p v-else-if="!hasContent" class="p-4 text-xs text-mute">
        No log is available for this job.
      </p>

      <div
        v-else
        v-bind="containerProps"
        class="overflow-auto font-mono text-[12px]"
        :style="{ height: `${VIEWPORT_HEIGHT}px` }"
      >
        <div v-bind="wrapperProps">
          <div
            v-for="item in list"
            :key="item.index"
            data-log-line
            class="flex items-start"
            :style="{ height: `${LINE_HEIGHT}px` }"
            :class="item.data.isError ? 'bg-[color:var(--pm-danger)]/12' : ''"
          >
            <span
              class="w-[68px] shrink-0 select-none border-r px-2.5 text-right text-[11px] leading-[19px] text-mute"
              :class="item.data.isError ? 'text-[var(--pm-danger)]' : ''"
            >
              {{ item.data.number }}
            </span>
            <span
              class="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-pre px-3 leading-[19px]"
              :class="item.data.isError ? 'font-medium text-[var(--pm-danger)]' : 'text-dim'"
            >{{ item.data.text }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="mt-1.5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-mute">
      <button v-if="errorLine" class="hover:text-accent" @click="jumpToError">
        Error on line {{ errorLine.number }} — jump to it
      </button>
      <span v-if="mode === 'full' && log?.line_count">{{ log.line_count.toLocaleString() }} lines</span>
    </div>
  </div>
</template>
