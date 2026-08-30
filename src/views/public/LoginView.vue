<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import type { ApiError } from '@/api/client'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const form = reactive({ email: '', password: '', remember: false })
const errors = ref<Record<string, string[]>>({})
const generalError = ref<string | null>(null)
const loading = ref(false)

async function submit() {
  loading.value = true
  errors.value = {}
  generalError.value = null

  try {
    await auth.login(form.email, form.password, form.remember)
    router.push((route.query.redirect as string) || { name: 'workspace' })
  }
  catch (e) {
    const error = e as ApiError

    // 422 goes per-field; anything else gets one banner. Never dump a raw error.
    if (error.validation)
      errors.value = error.validation
    else
      generalError.value = error.message
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <div>
    <h1 class="text-2xl font-semibold">Welcome back</h1>
    <p class="mt-1.5 text-sm text-dim">Sign in to your PipeMind workspace.</p>

    <p
      v-if="generalError"
      class="mt-6 rounded-[var(--pm-radius)] border border-[color:var(--pm-danger)]/30 bg-[color:var(--pm-danger)]/10 px-3.5 py-2.5 text-sm text-[var(--pm-danger)]"
    >
      {{ generalError }}
    </p>

    <form class="mt-7 space-y-4" @submit.prevent="submit">
      <div>
        <label for="email" class="mb-1.5 block text-[13px] font-medium">Email</label>
        <input
          id="email"
          v-model="form.email"
          type="email"
          autocomplete="email"
          required
          autofocus
          class="h-11 w-full rounded-[var(--pm-radius)] border bg-surface px-3.5 text-sm outline-none transition-colors placeholder:text-mute focus:border-[color:var(--pm-accent)]/50"
          placeholder="you@example.com"
        >
        <p v-if="errors.email" class="mt-1.5 text-xs text-[var(--pm-danger)]">
          {{ errors.email[0] }}
        </p>
      </div>

      <div>
        <label for="password" class="mb-1.5 block text-[13px] font-medium">Password</label>
        <input
          id="password"
          v-model="form.password"
          type="password"
          autocomplete="current-password"
          required
          class="h-11 w-full rounded-[var(--pm-radius)] border bg-surface px-3.5 text-sm outline-none transition-colors placeholder:text-mute focus:border-[color:var(--pm-accent)]/50"
          placeholder="••••••••••"
        >
        <p v-if="errors.password" class="mt-1.5 text-xs text-[var(--pm-danger)]">
          {{ errors.password[0] }}
        </p>
      </div>

      <label class="flex cursor-pointer items-center gap-2 text-[13px] text-dim">
        <input v-model="form.remember" type="checkbox" class="accent-[var(--pm-accent)]">
        Keep me signed in
      </label>

      <button
        type="submit"
        :disabled="loading"
        class="flex h-11 w-full items-center justify-center gap-2 rounded-[var(--pm-radius)] bg-accent text-sm font-semibold text-[var(--pm-on-accent)] transition-colors hover:bg-[var(--pm-accent-hi)] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <i-lucide-loader-circle v-if="loading" class="size-4 animate-spin" />
        Sign in
      </button>
    </form>
  </div>
</template>
