<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'

import { useAuthForm } from '@/composables/useAuthForm'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()
const { errors, generalError, loading, submit } = useAuthForm()

const form = reactive({ email: '', password: '', remember: false })

/*
 * The mockup shows GitHub / GitLab / Google sign-in. No OAuth backend exists —
 * no Socialite, no social_accounts table, and the callback URLs cannot be
 * registered while the tunnel hostname rotates.
 *
 * Rendered anyway, because the layout is part of the design, but saying so on
 * click rather than failing silently or opening nothing. Three dead buttons
 * would be worse than either.
 */
const SOCIAL = [
  { key: 'github', label: 'Continue with GitHub', icon: 'i-simple-icons-github' },
  { key: 'gitlab', label: 'Continue with GitLab', icon: 'i-simple-icons-gitlab' },
  { key: 'google', label: 'Continue with Google', icon: 'i-simple-icons-google' },
]

const socialNotice = ref<string | null>(null)

function comingSoon(label: string) {
  socialNotice.value = `${label.replace('Continue with ', '')} sign-in is not connected yet — `
    + 'use your email and password for now.'
}

function signIn() {
  submit(async () => {
    await auth.login(form.email, form.password, form.remember)
    // `redirect` carries the page they were trying to reach — including an
    // invitation link, which is why it is honoured before the workspace.
    router.push((route.query.redirect as string) || { name: 'workspace' })
  })
}
</script>

<template>
  <div>
    <!-- Wordmark repeats inside the card on desktop, where the showcase panel
         carries the larger one. -->
    <div class="mb-5 hidden items-center gap-2.5 lg:flex">
      <PmLogo class="size-7" />
      <span class="font-semibold">PipeMind</span>
    </div>

    <h1 class="text-[26px] font-bold tracking-tight">
      Welcome back
    </h1>
    <p class="mt-1.5 text-sm text-dim">
      Sign in to your account to continue to your workspace.
    </p>

    <PmAlert v-if="generalError" tone="danger" class="mt-6">
      {{ generalError }}
    </PmAlert>

    <form class="mt-7 space-y-4" @submit.prevent="signIn">
      <AuthField
        v-model="form.email"
        label="Email address"
        type="email"
        autocomplete="email"
        placeholder="you@example.com"
        icon="i-lucide-mail"
        size="lg"
        autofocus
        :errors="errors.email"
      />

      <AuthField
        v-model="form.password"
        label="Password"
        type="password"
        autocomplete="current-password"
        placeholder="Enter your password"
        icon="i-lucide-lock"
        size="lg"
        revealable
        :errors="errors.password"
      />

      <div class="flex items-center justify-between gap-3">
        <label class="flex cursor-pointer items-center gap-2 text-[13px] text-dim">
          <input
            v-model="form.remember"
            type="checkbox"
            class="size-4 rounded accent-[var(--pm-accent)]"
          >
          Remember me
        </label>

        <RouterLink
          :to="{ name: 'forgot-password' }"
          class="text-[13px] font-medium text-accent hover:underline"
        >
          Forgot password?
        </RouterLink>
      </div>

      <PmButton type="submit" variant="primary" size="lg" block :loading="loading">
        <i-lucide-arrow-right class="size-4" />Sign in
      </PmButton>

      <div class="relative py-1 text-center">
        <span class="absolute inset-x-0 top-1/2 h-px bg-[var(--pm-border,rgb(255_255_255/0.08))]" />
        <span class="relative bg-surface px-3 text-[12px] text-mute">or</span>
      </div>

      <div class="space-y-2.5">
        <button
          v-for="provider in SOCIAL"
          :key="provider.key"
          type="button"
          class="pm-social flex h-11 w-full items-center justify-center gap-2.5 rounded-[var(--pm-radius)] border bg-surface text-[13px] font-medium"
          @click="comingSoon(provider.label)"
        >
          <i :class="provider.icon" class="size-4" />{{ provider.label }}
        </button>
      </div>

      <PmAlert v-if="socialNotice" tone="info">{{ socialNotice }}</PmAlert>
    </form>

    <p class="mt-6 text-[13px] text-dim">
      Don't have an account?
      <RouterLink :to="{ name: 'register' }" class="font-medium text-accent hover:underline">
        Create one
      </RouterLink>
    </p>
  </div>
</template>

<style scoped>
.pm-social {
  transition: transform 160ms ease, border-color 160ms ease, background-color 160ms ease;
}

.pm-social:hover {
  transform: translateY(-1px);
  border-color: color-mix(in oklab, var(--pm-accent) 30%, transparent);
  background: var(--pm-surface-2);
}

@media (prefers-reduced-motion: reduce) {
  .pm-social:hover { transform: none; }
}
</style>
