<script setup lang="ts">
import { useRouter } from 'vue-router'

import { useAuthForm } from '@/composables/useAuthForm'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()
const { errors, generalError, loading, submit } = useAuthForm()

const form = reactive({
  name: '',
  email: '',
  password: '',
  password_confirmation: '',
  team_name: '',
})

// Suggested, not forced: "Oussema's workspace" is a better default than an
// empty box, and anyone who cares can overwrite it.
const suggestedTeam = computed(() =>
  form.name.trim() ? `${form.name.trim().split(' ')[0]}'s workspace` : '',
)

function register() {
  submit(async () => {
    await auth.register({ ...form, team_name: form.team_name || suggestedTeam.value })
    // Straight to onboarding: a brand-new workspace has no projects, and the
    // board would be an empty page with no instruction on it.
    router.push({ name: 'onboarding' })
  })
}
</script>

<template>
  <div>
    <h1 class="text-2xl font-semibold">
      Create your workspace
    </h1>
    <p class="mt-1.5 text-sm text-dim">
      Connect a CI provider and PipeMind starts explaining your failures.
    </p>

    <PmAlert v-if="generalError" tone="danger" class="mt-6">
      {{ generalError }}
    </PmAlert>

    <form class="mt-7 space-y-4" @submit.prevent="register">
      <AuthField
        v-model="form.name"
        label="Your name"
        autocomplete="name"
        placeholder="Oussema Jbeli"
        autofocus
        :errors="errors.name"
      />

      <AuthField
        v-model="form.email"
        label="Work email"
        type="email"
        autocomplete="email"
        placeholder="you@example.com"
        :errors="errors.email"
      />

      <AuthField
        v-model="form.password"
        label="Password"
        type="password"
        autocomplete="new-password"
        placeholder="••••••••••"
        :errors="errors.password"
      >
        <template #below>
          <PasswordStrength :password="form.password" />
        </template>
      </AuthField>

      <AuthField
        v-model="form.password_confirmation"
        label="Confirm password"
        type="password"
        autocomplete="new-password"
        placeholder="••••••••••"
      />

      <AuthField
        v-model="form.team_name"
        label="Workspace name"
        :required="false"
        :placeholder="suggestedTeam || 'Acme Engineering'"
        hint="You can rename this later."
        :errors="errors.team_name"
      />

      <PmButton type="submit" variant="primary" block :loading="loading">
        Create workspace
      </PmButton>
    </form>

    <p class="mt-6 text-[13px] text-dim">
      Already have an account?
      <RouterLink :to="{ name: 'login' }" class="font-medium text-accent hover:underline">
        Sign in
      </RouterLink>
    </p>
  </div>
</template>
