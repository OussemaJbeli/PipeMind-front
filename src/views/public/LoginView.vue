<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'

import { useAuthForm } from '@/composables/useAuthForm'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()
const { errors, generalError, loading, submit } = useAuthForm()

const form = reactive({ email: '', password: '', remember: false })

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
    <h1 class="text-2xl font-semibold">
      Welcome back
    </h1>
    <p class="mt-1.5 text-sm text-dim">
      Sign in to your PipeMind workspace.
    </p>

    <PmAlert v-if="generalError" tone="danger" class="mt-6">
      {{ generalError }}
    </PmAlert>

    <form class="mt-7 space-y-4" @submit.prevent="signIn">
      <AuthField
        v-model="form.email"
        label="Email"
        type="email"
        autocomplete="email"
        placeholder="you@example.com"
        autofocus
        :errors="errors.email"
      />

      <AuthField
        v-model="form.password"
        label="Password"
        type="password"
        autocomplete="current-password"
        placeholder="••••••••••"
        :errors="errors.password"
      >
        <template #label-suffix>
          <RouterLink
            :to="{ name: 'forgot-password' }"
            class="text-xs font-medium text-accent hover:underline"
          >
            Forgot?
          </RouterLink>
        </template>
      </AuthField>

      <label class="flex cursor-pointer items-center gap-2 text-[13px] text-dim">
        <input v-model="form.remember" type="checkbox" class="accent-[var(--pm-accent)]">
        Keep me signed in
      </label>

      <PmButton type="submit" variant="primary" block :loading="loading">
        Sign in
      </PmButton>
    </form>

    <p class="mt-6 text-[13px] text-dim">
      New to PipeMind?
      <RouterLink :to="{ name: 'register' }" class="font-medium text-accent hover:underline">
        Create a workspace
      </RouterLink>
    </p>
  </div>
</template>
