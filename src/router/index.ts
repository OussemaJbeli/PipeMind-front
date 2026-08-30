import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: () => ({ name: 'workspace' }),
  },

  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/public/LoginView.vue'),
    meta: { layout: 'auth', guest: true },
  },

  {
    path: '/app',
    meta: { requiresAuth: true, layout: 'workspace' },
    children: [
      {
        path: '',
        name: 'workspace',
        component: () => import('@/views/workspace/WorkspaceView.vue'),
      },
    ],
  },

  {
    path: '/app/projects/:slug',
    meta: { requiresAuth: true, layout: 'project' },
    props: true,
    children: [
      {
        path: '',
        name: 'project.overview',
        component: () => import('@/views/project/ProjectOverviewView.vue'),
      },
    ],
  },

  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/errors/NotFoundView.vue'),
    meta: { layout: 'blank' },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: (_to, _from, saved) => saved ?? { top: 0 },
})

export default router
