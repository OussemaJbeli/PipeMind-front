import { useAuthStore } from '@/stores/auth'
import router from './index'

/**
 * Convenience, not security. Every route below is also enforced by a Laravel
 * policy — a guard that is the only check is a client-side lock on a
 * server-side door.
 */
router.beforeEach(async (to) => {
  const auth = useAuthStore()

  if (!auth.ready)
    await auth.fetchUser()

  if (to.meta.requiresAuth && !auth.isAuthenticated)
    return { name: 'login', query: { redirect: to.fullPath } }

  if (to.meta.guest && auth.isAuthenticated)
    return { name: 'workspace' }

  if (to.meta.permission && !auth.can(to.meta.permission as string))
    return { name: 'workspace' }

  return true
})

export default router
