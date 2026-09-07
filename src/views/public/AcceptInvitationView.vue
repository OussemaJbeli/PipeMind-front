<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'

import { api, type ApiError } from '@/api/client'
import { useAuthForm } from '@/composables/useAuthForm'
import { useAuthStore } from '@/stores/auth'
import type { Envelope } from '@/types/api'

interface Preview {
  team: { name: string, slug: string }
  invited_by: string | null
  email: string
  role: string
  expires_at: string
}

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const { errors, generalError, loading, submit } = useAuthForm()

const token = String(route.params.token ?? '')

const preview = ref<Preview | null>(null)
const previewError = ref<string | null>(null)
const checking = ref(true)

// Fetched before anything is asked of the user: nobody should have to create an
// account to find out which workspace invited them.
onMounted(async () => {
  try {
    preview.value = (await api.get<Envelope<Preview>>(`/invitations/${token}`)).data.data
  }
  catch (thrown) {
    previewError.value = (thrown as ApiError).message ?? 'This invitation is not valid.'
  }
  finally {
    checking.value = false
  }
})

/** Signed in already: one click to join. */
const alreadySignedIn = computed(() => Boolean(auth.user))

const wrongAccount = computed(() =>
  Boolean(auth.user && preview.value
    && auth.user.email.toLowerCase() !== preview.value.email.toLowerCase()),
)

const form = reactive({ name: '', password: '', password_confirmation: '' })

function join() {
  submit(async () => {
    await auth.acceptInvitation(token)
    router.push({ name: 'workspace' })
  })
}

function registerAndJoin() {
  submit(async () => {
    await auth.register({
      name: form.name,
      email: preview.value!.email,
      password: form.password,
      password_confirmation: form.password_confirmation,
      // No workspace name: they are joining an existing one, and creating a
      // second empty workspace alongside it would be confusing.
    })
    await auth.acceptInvitation(token)
    router.push({ name: 'workspace' })
  })
}
</script>

<template>
  <div>
    <PmSkeleton v-if="checking" class="h-40" />

    <template v-else-if="previewError">
      <div class="grid size-11 place-items-center rounded-full bg-[color:var(--pm-warning)]/12">
        <i-lucide-link-2-off class="size-5 text-[var(--pm-warning)]" />
      </div>
      <h1 class="mt-5 text-2xl font-semibold">
        This invitation isn't valid
      </h1>
      <p class="mt-2 text-sm text-dim">
        {{ previewError }} Ask whoever invited you to send a new one.
      </p>
      <RouterLink :to="{ name: 'login' }" class="mt-7 inline-block text-[13px] font-medium text-accent hover:underline">
        Back to sign in
      </RouterLink>
    </template>

    <template v-else-if="preview">
      <p class="text-[13px] text-mute">
        <span v-if="preview.invited_by" class="font-medium text-fg">{{ preview.invited_by }}</span>
        <span v-else>Someone</span>
        invited you to
      </p>
      <h1 class="mt-1 text-2xl font-semibold">
        {{ preview.team.name }}
      </h1>
      <p class="mt-1.5 text-sm text-dim">
        You'll join as <span class="font-medium text-fg">{{ preview.role }}</span>,
        using <span class="font-medium text-fg">{{ preview.email }}</span>.
      </p>

      <PmAlert v-if="generalError" tone="danger" class="mt-6">
        {{ generalError }}
      </PmAlert>

      <!--
        Signed in as somebody else. Offering "join" here would fail server-side,
        because the invitation names an address — so say why, and offer the one
        action that actually works.
      -->
      <template v-if="wrongAccount">
        <PmAlert tone="warning" class="mt-6">
          You're signed in as {{ auth.user?.email }}, but this invitation was sent to
          {{ preview.email }}. Sign out and use that address instead.
        </PmAlert>
        <PmButton variant="secondary" class="mt-4" @click="auth.logout()">
          Sign out
        </PmButton>
      </template>

      <template v-else-if="alreadySignedIn">
        <PmButton variant="primary" block class="mt-7" :loading="loading" @click="join">
          Join {{ preview.team.name }}
        </PmButton>
      </template>

      <form v-else class="mt-7 space-y-4" @submit.prevent="registerAndJoin">
        <AuthField
          v-model="form.name"
          label="Your name"
          autocomplete="name"
          placeholder="Oussema Jbeli"
          autofocus
          :errors="errors.name"
        />

        <AuthField
          v-model="form.password"
          label="Choose a password"
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

        <PmButton type="submit" variant="primary" block :loading="loading">
          Create account and join
        </PmButton>

        <p class="text-[13px] text-dim">
          Already have an account?
          <RouterLink
            :to="{ name: 'login', query: { redirect: route.fullPath } }"
            class="font-medium text-accent hover:underline"
          >
            Sign in first
          </RouterLink>
        </p>
      </form>
    </template>
  </div>
</template>
