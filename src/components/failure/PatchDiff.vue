<script setup lang="ts">
const props = withDefaults(defineProps<{
  patch: string
  truncated?: boolean
  /** Collapsed by default inside a card; expanded when the diff IS the point. */
  open?: boolean
}>(), { open: true })

interface Line { kind: 'add' | 'del' | 'ctx' | 'hunk' | 'meta', text: string }

const lines = computed<Line[]>(() =>
  props.patch.split('\n').map((text) => {
    if (text.startsWith('@@'))
      return { kind: 'hunk' as const, text }

    if (text.startsWith('+++') || text.startsWith('---') || text.startsWith('diff '))
      return { kind: 'meta' as const, text }

    if (text.startsWith('+'))
      return { kind: 'add' as const, text }

    if (text.startsWith('-'))
      return { kind: 'del' as const, text }

    return { kind: 'ctx' as const, text }
  }),
)

const added = computed(() => lines.value.filter(l => l.kind === 'add').length)
const removed = computed(() => lines.value.filter(l => l.kind === 'del').length)

// Colour alone would fail for a red-green colour-blind reader, and this is
// precisely the content where confusing an addition with a removal is worst.
const PREFIX: Record<Line['kind'], string> = {
  add: '+', del: '−', ctx: ' ', hunk: '@', meta: ' ',
}
</script>

<template>
  <div class="overflow-hidden rounded-[var(--pm-radius)] border">
    <div class="flex items-center gap-2 border-b bg-surface-2 px-3 py-1.5 text-[11px]">
      <i-lucide-file-diff class="size-3.5 text-mute" />
      <span class="font-medium">Suggested change</span>
      <span class="ml-auto flex items-center gap-2 font-mono">
        <span class="text-accent">+{{ added }}</span>
        <span class="text-[var(--pm-danger)]">−{{ removed }}</span>
      </span>
    </div>

    <div class="overflow-x-auto bg-[var(--pm-surface-2)]">
      <table class="w-full border-collapse font-mono text-[12px] leading-[1.6]">
        <tbody>
          <tr
            v-for="(line, index) in lines"
            :key="index"
            :class="{
              'bg-[color:var(--pm-accent)]/12': line.kind === 'add',
              'bg-[color:var(--pm-danger)]/12': line.kind === 'del',
              'bg-surface-3': line.kind === 'hunk',
            }"
          >
            <td
              class="w-[1%] select-none whitespace-nowrap border-r px-2 text-center align-top"
              :class="line.kind === 'add'
                ? 'text-accent'
                : line.kind === 'del' ? 'text-[var(--pm-danger)]' : 'text-mute'"
            >{{ PREFIX[line.kind] }}</td>

            <td
              class="whitespace-pre-wrap break-all px-3 align-top"
              :class="{
                'text-accent': line.kind === 'add',
                'text-[var(--pm-danger)]': line.kind === 'del',
                'text-mute': line.kind === 'hunk' || line.kind === 'meta',
                'text-dim': line.kind === 'ctx',
              }"
            >{{ line.text.replace(/^[+-]/, '') }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <p v-if="truncated" class="border-t px-3 py-1.5 text-[11px] text-mute">
      Diff truncated — open the commit in your provider to see the rest.
    </p>

    <!--
      Stated, not implied. PipeMind does not execute changes, and a diff that
      looks applyable invites the assumption that something already applied it.
    -->
    <p class="border-t bg-surface px-3 py-1.5 text-[11px] text-mute">
      Review before applying. PipeMind does not change your code.
    </p>
  </div>
</template>
