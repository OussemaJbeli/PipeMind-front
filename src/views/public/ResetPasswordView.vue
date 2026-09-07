<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'

import { useAuthForm } from '@/composables/useAuthForm'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const { errors, generalError, loading, submit } = useAuthForm()

// Both arrive in the link the user clicked: the token in the path, the address
// in the query. Prefilling the email means one fewer thing to mistype at the
// least patient moment in the whole flow.
const token = String(route.params.token ?? '')
const form = reactive({
  email: String(route.query.email ?? ''),
  password: '',
  password_confirmation: '',
})

const done = ref(false)

function reset() {
  submit(async () => {
    await auth.resetPassword({ token, ...form })
    done.value = true
  })
}
</script>

<template>
  <div>
    <template v-if="done">
      <div class="grid size-11 place-items-center rounded-full bg-[color:var(--pm-accent)]/12">
        <i-lucide-shield-check class="size-5 text-accent" />
      </div>

      <h1 class="mt-5 text-2xl font-semibold">
        Password changed
      </h1>
      <!-- Stated because it is surprising: a reset is often a response to a
           compromise, so every other session and API token was revoked. -->
      <p class="mt-2 text-sm text-dim">
        Every other session and API token was signed out, on every device.
      </p>

      <PmButton variant="primary" class="mt-7" @click="router.push({ name: 'login' })">
        Sign in
      </PmButton>
    </template>

    <template v-else>
      <h1 class="text-2xl font-semibold">
        Choose a new password
      </h1>
      <p class="mt-1.5 text-sm text-dim">
        Reset links expire an hour after they're sent.
      </p>

      <PmAlert v-if="generalError" tone="danger" class="mt-6">
        {{ generalError }}
      </PmAlert>

      <form class="mt-7 space-y-4" @submit.prevent="reset">
        <AuthField
          v-model="form.email"
          label="Email"
          type="email"
          autocomplete="email"
          :errors="errors.email"
        />

        <AuthField
          v-model="form.password"
          label="New password"
          type="password"
          autocomplete="new-password"
          placeholder="••••••••••"
          autofocus
          :errors="errors.password"
        >
          <template #below>
            <PasswordStrength :password="form.password" />
          </template>
        </AuthField>

        <AuthField
          v-model="form.password_confirmation"
          label="Confirm new password"
          type="password"
          autocomplete="new-password"
          placeholder="••••••••••"
        />

        <PmButton type="submit" variant="primary" block :loading="loading">
          Set new password
        </PmButton>
      </form>

      <p class="mt-6 text-[13px] text-dim">
        Link expired?
        <RouterLink :to="{ name: 'forgot-password' }" class="font-medium text-accent hover:underline">
          Request a new one
        </RouterLink>
      </p>
    </template>
  </div>
</template>
