import { computed, toValue, type MaybeRefOrGetter } from 'vue'

import { useAuthStore } from '@/stores/auth'

/**
 * Convenience wrapper. Permissions come from the server's role matrix; never
 * re-derive them from `role` in a component.
 */
export function useCan(permission: MaybeRefOrGetter<string>) {
  const auth = useAuthStore()

  return computed(() => auth.can(toValue(permission)))
}
