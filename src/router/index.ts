import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'landing',
    component: () => import('@/views/public/LandingView.vue'),
    // Public, and deliberately NOT guest-only: a signed-in user following a
    // shared link should see the page, with a button into their workspace,
    // rather than being bounced somewhere they did not ask for.
    meta: { layout: 'blank' },
  },

  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/public/LoginView.vue'),
    meta: { layout: 'auth', guest: true },
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('@/views/public/RegisterView.vue'),
    meta: { layout: 'auth', guest: true },
  },
  {
    path: '/forgot-password',
    name: 'forgot-password',
    component: () => import('@/views/public/ForgotPasswordView.vue'),
    meta: { layout: 'auth', guest: true },
  },
  {
    path: '/reset-password/:token',
    name: 'reset-password',
    component: () => import('@/views/public/ResetPasswordView.vue'),
    meta: { layout: 'auth', guest: true },
  },
  {
    // NOT guest-only: someone already signed in should be able to accept an
    // invitation without logging out first.
    path: '/invitations/:token',
    name: 'accept-invitation',
    component: () => import('@/views/public/AcceptInvitationView.vue'),
    meta: { layout: 'auth' },
  },

  {
    // `/welcome`, not nested under /app: onboarding has no sidebar, and the
    // workspace layout would frame an empty workspace with navigation for
    // things that do not exist yet.
    path: '/welcome',
    name: 'onboarding',
    component: () => import('@/views/onboarding/OnboardingView.vue'),
    meta: { requiresAuth: true, layout: 'blank' },
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
      {
        path: 'projects',
        name: 'projects',
        component: () => import('@/views/workspace/ProjectsView.vue'),
      },
      {
        path: 'activity',
        name: 'activity',
        component: () => import('@/views/workspace/ActivityView.vue'),
      },
      {
        path: 'members',
        name: 'members',
        component: () => import('@/views/workspace/MembersView.vue'),
      },
      {
        path: 'ai-providers',
        name: 'ai-providers',
        component: () => import('@/views/workspace/AiProvidersView.vue'),
        meta: { permission: 'ai.manage' },
      },
      {
        path: 'policies',
        name: 'policies',
        component: () => import('@/views/workspace/PoliciesView.vue'),
        meta: { permission: 'policies.edit' },
      },
      {
        path: 'settings',
        name: 'workspace-settings',
        component: () => import('@/views/workspace/WorkspaceSettingsView.vue'),
      },
      {
        path: 'integrations',
        name: 'integrations',
        component: () => import('@/views/workspace/IntegrationsView.vue'),
        meta: { permission: 'integrations.manage' },
      },
    ],
  },

  {
    path: '/app/projects/:slug',
    meta: { requiresAuth: true, layout: 'project' },
    children: [
      {
        path: '',
        name: 'project.overview',
        component: () => import('@/views/project/ProjectOverviewView.vue'),
        // props must be declared on the CHILD: Vue Router does not propagate a
        // parent's `props: true` down to nested routes, so the child would
        // receive slug === undefined.
        props: true,
      },
      {
        path: 'pipelines',
        name: 'project.pipelines',
        component: () => import('@/views/project/PipelinesView.vue'),
        props: true,
      },
      {
        // Bound by iid, not uuid: #821 is the number the provider shows and the
        // number people quote to each other.
        path: 'pipelines/:iid',
        name: 'project.pipeline',
        component: () => import('@/views/project/PipelineDetailView.vue'),
        props: true,
      },
      {
        path: 'analytics',
        name: 'project.analytics',
        component: () => import('@/views/project/AnalyticsView.vue'),
        props: true,
      },
      {
        path: 'analyses',
        name: 'project.analyses',
        component: () => import('@/views/project/AnalysesView.vue'),
        props: true,
      },
      {
        path: 'history',
        name: 'project.history',
        component: () => import('@/views/project/FailureHistoryView.vue'),
        props: true,
      },
      {
        path: 'failures',
        name: 'project.failures',
        component: () => import('@/views/project/FailuresView.vue'),
        props: true,
      },
      {
        // The flagship screen. Addressed by failure UUID rather than pipeline
        // iid: a user following a link cares about the error, not the run it
        // happened to appear in.
        path: 'failures/:uuid',
        name: 'project.failure',
        component: () => import('@/views/project/FailureDetailView.vue'),
        props: true,
      },
      {
        path: 'remediation',
        name: 'project.remediation',
        component: () => import('@/views/project/RemediationView.vue'),
        props: true,
      },
      {
        path: 'knowledge',
        name: 'project.knowledge',
        component: () => import('@/views/project/KnowledgeView.vue'),
        props: true,
      },
      {
        path: 'integration',
        name: 'project.integration',
        component: () => import('@/views/project/ProjectIntegrationView.vue'),
        props: true,
        meta: { permission: 'projects.manage' },
      },
      {
        path: 'settings',
        name: 'project.settings',
        component: () => import('@/views/project/ProjectSettingsView.vue'),
        props: true,
        meta: { permission: 'projects.manage' },
      },
    ],
  },

  // Dev-only: every base component and chart in both themes.
  ...(import.meta.env.DEV
    ? [{
        path: '/_kitchen-sink',
        name: 'kitchen-sink',
        component: () => import('@/views/KitchenSinkView.vue'),
        meta: { requiresAuth: false, layout: 'workspace' as const },
      }]
    : []),

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
