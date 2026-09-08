import { readonly, ref } from 'vue'

export type ToastTone = 'info' | 'success' | 'warning' | 'danger'

export interface ToastAction {
  label: string
  run: () => void
}

export interface Toast {
  id: number
  tone: ToastTone
  title: string
  description?: string
  action?: ToastAction
  /** Milliseconds; null pins the toast until it is dismissed. */
  timeout: number | null
}

const items = ref<Toast[]>([])
let nextId = 1

/** Beyond this the stack becomes a wall nobody reads. Oldest goes first. */
const MAX_VISIBLE = 4

export function useToasts() {
  function dismiss(id: number) {
    items.value = items.value.filter(toast => toast.id !== id)
  }

  function push(toast: Omit<Toast, 'id' | 'timeout'> & { timeout?: number | null }): number {
    const id = nextId++
    // Failures pin by default: they carry an action, and a notification that
    // vanishes before it is read is worse than none.
    const timeout = toast.timeout === undefined
      ? (toast.tone === 'danger' ? null : 6_000)
      : toast.timeout

    items.value = [...items.value, { ...toast, id, timeout }].slice(-MAX_VISIBLE)

    if (timeout !== null)
      setTimeout(() => dismiss(id), timeout)

    return id
  }

  return { toasts: readonly(items), push, dismiss }
}
