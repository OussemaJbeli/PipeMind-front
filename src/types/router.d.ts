import 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    layout?: 'workspace' | 'project' | 'auth' | 'blank' | 'public'
    requiresAuth?: boolean
    guest?: boolean
    permission?: string
  }
}
