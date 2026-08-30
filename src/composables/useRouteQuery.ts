import { computed, type WritableComputedRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'

/**
 * Two-way binding between a query parameter and a ref.
 *
 * Filters and ranges belong in the URL: a filtered view has to be shareable and
 * survive a reload, and the back button should undo a range change.
 */
export function useRouteQuery<T extends string>(
  key: string,
  defaultValue: T,
): WritableComputedRef<T> {
  const route = useRoute()
  const router = useRouter()

  return computed<T>({
    get: () => (route.query[key] as T) ?? defaultValue,
    set: (value) => {
      const query = { ...route.query }

      if (value === defaultValue)
        delete query[key]
      else
        query[key] = value

      // replace, not push: a range toggle should not fill the history stack.
      void router.replace({ query })
    },
  })
}
