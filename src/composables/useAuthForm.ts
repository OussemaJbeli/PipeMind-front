import { ref } from 'vue'

import type { ApiError } from '@/api/client'

/**
 * The submit/error dance every auth form repeats.
 *
 * 422 goes per-field; anything else gets one banner. A raw error is never shown
 * — "SQLSTATE[23505]" on a sign-up form tells the user nothing and tells an
 * attacker something.
 */
export function useAuthForm() {
  const errors = ref<Record<string, string[]>>({})
  const generalError = ref<string | null>(null)
  const loading = ref(false)

  async function submit(action: () => Promise<void>) {
    loading.value = true
    errors.value = {}
    generalError.value = null

    try {
      await action()
    }
    catch (thrown) {
      const error = thrown as ApiError

      if (error.validation)
        errors.value = error.validation
      else
        generalError.value = error.message ?? 'Something went wrong. Try again.'
    }
    finally {
      loading.value = false
    }
  }

  return { errors, generalError, loading, submit }
}
