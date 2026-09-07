<script setup lang="ts">
import { useAuthForm } from '@/composables/useAuthForm'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const { errors, generalError, loading, submit } = useAuthForm()

const email = ref('')
const sent = ref(false)

function request() {
  submit(async () => {
    await auth.forgotPassword(email.value)
    sent.value = true
  })
}
</script>

<template>
  <div>
    <!--
      The success state is shown whether or not the address exists, mirroring
      what the API does. A form that says "no account with that email" is an
      account-enumeration oracle with a friendly face.
    -->
    <template v-if="sent">
      <div class="grid size-11 place-items-center rounded-full bg-[color:var(--pm-accent)]/12">
        <i-lucide-mail-check class="size-5 text-accent" />
      </div>

      <h1 class="mt-5 text-2xl font-semibold">
        Check your inbox
      </h1>
      <p class="mt-2 text-sm text-dim">
        If <span class="font-medium text-fg">{{ email }}</span> has a PipeMind account,
        a reset link is on its way. The link expires in 60 minutes.
      </p>

      <div class="mt-7 flex items-center gap-3">
        <PmButton variant="secondary" size="sm" @click="sent = false">
          Use a different address
        </PmButton>
        <RouterLink :to="{ name: 'login' }" class="text-[13px] font-medium text-accent hover:underline">
          Back to sign in
        </RouterLink>
      </div>
    </template>

    <template v-else>
      <h1 class="text-2xl font-semibold">
        Reset your password
      </h1>
      <p class="mt-1.5 text-sm text-dim">
        We'll email you a link to choose a new one.
      </p>

      <PmAlert v-if="generalError" tone="danger" class="mt-6">
        {{ generalError }}
      </PmAlert>

      <form class="mt-7 space-y-4" @submit.prevent="request">
        <AuthField
          v-model="email"
          label="Email"
          type="email"
          autocomplete="email"
          placeholder="you@example.com"
          autofocus
          :errors="errors.email"
        />

        <PmButton type="submit" variant="primary" block :loading="loading">
          Send reset link
        </PmButton>
      </form>

      <p class="mt-6 text-[13px] text-dim">
        Remembered it?
        <RouterLink :to="{ name: 'login' }" class="font-medium text-accent hover:underline">
          Sign in
        </RouterLink>
      </p>
    </template>
  </div>
</template>
