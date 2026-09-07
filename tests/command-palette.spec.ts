import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { createPinia, setActivePinia } from 'pinia'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'

import CommandPalette from '@/components/layout/CommandPalette.vue'
import { useUiStore } from '@/stores/ui'

/**
 * Keyboard navigation crosses group boundaries, so the flattened index is the
 * thing that has to be right. It lives in the composable rather than the
 * component precisely so there is one implementation for the template and the
 * keyboard handlers to agree with.
 */
function mountPalette() {
  return mount(CommandPalette, {
    global: {
      plugins: [[VueQueryPlugin, {
        queryClient: new QueryClient({ defaultOptions: { queries: { retry: false } } }),
      }]],
      stubs: { PmButton: true },
    },
  })
}

describe('commandPalette', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    // The palette teleports to body, so the wrapper's own tree never contains
    // it — assertions read document.body, and it must be clean between tests.
    document.body.innerHTML = ''
  })

  it('stays closed until the store says otherwise', () => {
    mountPalette()

    expect(document.querySelector('[role="dialog"]')).toBeNull()
  })

  it('opens from the store and prints the shortcut', async () => {
    const ui = useUiStore()
    mountPalette()

    ui.commandPaletteOpen = true
    await nextTick()

    const dialog = document.querySelector('[role="dialog"]')

    expect(dialog).not.toBeNull()
    // ⌘K is undiscoverable unless it is written down.
    expect(dialog!.textContent).toContain('⌘K to toggle')
  })

  it('shows a way out rather than trapping the user', async () => {
    const ui = useUiStore()
    mountPalette()

    ui.commandPaletteOpen = true
    await nextTick()

    const dialog = document.querySelector('[role="dialog"]')!

    expect(dialog.textContent).toContain('esc')
    expect(dialog.textContent).toContain('navigate')
  })

  it('does not query the server below two characters', async () => {
    const ui = useUiStore()
    mountPalette()

    ui.commandPaletteOpen = true
    await nextTick()

    const input = document.querySelector('input')!
    input.value = 'b'
    input.dispatchEvent(new Event('input'))
    await nextTick()

    // One character matches almost everything at full table-scan cost. The
    // server refuses too; this avoids the round trip to be told nothing.
    expect(document.querySelector('[role="dialog"]')!.textContent).not.toContain('Nothing matches')
  })
})
