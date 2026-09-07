import { useDebounce } from '@vueuse/core'
import { keepPreviousData, useQuery } from '@tanstack/vue-query'
import { computed, ref, toValue, watch, type MaybeRefOrGetter } from 'vue'

import { api } from '@/api/client'
import type { Envelope } from '@/types/api'

export interface SearchItem {
  id: string
  title: string
  subtitle: string | null
  color?: string | null
  route: { name: string, params?: Record<string, string | number> } | null
}

export interface SearchGroup {
  type: 'project' | 'pipeline' | 'failure' | 'signature'
  label: string
  items: SearchItem[]
}

export const GROUP_ICON: Record<string, string> = {
  project: 'i-lucide-folder',
  pipeline: 'i-lucide-git-branch',
  failure: 'i-lucide-triangle-alert',
  signature: 'i-lucide-history',
}

export function useCommandPalette(fallback: MaybeRefOrGetter<SearchGroup[]> = []) {
  const query = ref('')

  // Debounced: the palette fires on every keystroke, and one request per
  // character turns a search box into a load generator.
  const debounced = useDebounce(query, 200)

  const { data, isFetching } = useQuery({
    queryKey: computed(() => ['search', debounced.value]),
    queryFn: async () => {
      const { data } = await api.get<Envelope<{ query: string, groups: SearchGroup[] }>>(
        '/search',
        { params: { q: debounced.value } },
      )

      return data.data.groups
    },
    // Two characters is the server's own floor; asking below it wastes a round
    // trip to be told nothing.
    enabled: computed(() => debounced.value.trim().length >= 2),
    staleTime: 20_000,
    placeholderData: keepPreviousData,
  })

  const searching = computed(() => query.value.trim().length >= 2)

  /**
   * With no query, show the fallback rather than an empty box.
   *
   * An empty palette is a dead end, and "jump to a project" is the commonest
   * reason to open it. Resolved here rather than in the component so that
   * flattening and keyboard navigation have one implementation to agree with.
   */
  const groups = computed<SearchGroup[]>(() =>
    searching.value ? (data.value ?? []) : toValue(fallback))

  /** Flattened, because keyboard navigation crosses group boundaries. */
  const flat = computed(() => groups.value.flatMap((group, gi) =>
    group.items.map((item, ii) => ({ group, item, index: indexOf(gi, ii) }))))

  function indexOf(groupIndex: number, itemIndex: number) {
    return groups.value.slice(0, groupIndex).reduce((sum, g) => sum + g.items.length, 0) + itemIndex
  }

  const active = ref(0)

  // Any change to the result set invalidates the highlighted row.
  watch(flat, () => (active.value = 0))

  function move(delta: number) {
    if (!flat.value.length)
      return

    // Wraps, so holding ↓ never dead-ends at the last row.
    active.value = (active.value + delta + flat.value.length) % flat.value.length
  }

  function reset() {
    query.value = ''
    active.value = 0
  }

  const selected = computed(() => flat.value[active.value]?.item ?? null)

  return { query, groups, flat, active, move, reset, isFetching, searching, indexOf, selected }
}
