<script setup lang="ts">
import type { ApiError } from '@/api/client'
import { useInvitations, useMemberActions, useMembers } from '@/api/queries/workspaceAdmin'
import { useAuthStore } from '@/stores/auth'

const { data: members, isPending, isError, error, refetch } = useMembers()
const { data: invitations } = useInvitations()
const actions = useMemberActions()
const auth = useAuthStore()

// useCan() returns a computed for ONE permission; the store's method is the
// right tool when the same check is needed in several places on a page.
const canManage = computed(() => auth.can('team.manage'))

const inviting = ref(false)
const invite = reactive({ email: '', role: 'member' })
const inviteError = ref<string | null>(null)
const lastLink = ref<string | null>(null)

const ROLES = [
  { key: 'admin', label: 'Admin' },
  { key: 'member', label: 'Member' },
  { key: 'viewer', label: 'Viewer' },
]

function sendInvite() {
  inviteError.value = null

  actions.invite.mutate({ ...invite }, {
    onSuccess: (created) => {
      // Mail delivery lands in roadmaps/20. Until then this link is the only way
      // anyone actually joins, so it is shown rather than assumed sent.
      lastLink.value = created.accept_url ?? null
      invite.email = ''
      inviting.value = false
    },
    onError: thrown => (inviteError.value = (thrown as unknown as ApiError).message),
  })
}

const copied = ref(false)

async function copyLink() {
  if (!lastLink.value)
    return

  try {
    await navigator.clipboard.writeText(lastLink.value)
    copied.value = true
    setTimeout(() => (copied.value = false), 1600)
  }
  catch { /* Clipboard needs permission and HTTPS; the text stays selectable. */ }
}
</script>

<template>
  <div class="mx-auto max-w-[1100px]">
    <div class="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 class="text-xl font-semibold">Members</h1>
        <p class="mt-1 text-sm text-dim">
          Who can see and act on this workspace.
        </p>
      </div>
      <PmButton v-if="canManage" variant="primary" size="sm" @click="inviting = true">
        Invite someone
      </PmButton>
    </div>

    <PmCard v-if="lastLink" class="mb-4">
      <p class="text-[13px] font-medium">Invitation created</p>
      <p class="mt-1 text-xs text-dim">
        Email delivery isn't wired up yet — send this link yourself.
      </p>
      <button
        class="mt-3 flex w-full items-center gap-3 rounded-[var(--pm-radius)] border bg-[var(--pm-surface-2)] px-3 py-2.5 text-left font-mono text-[11px] text-dim hover:border-[color:var(--pm-accent)]/40"
        @click="copyLink"
      >
        <span class="min-w-0 flex-1 truncate">{{ lastLink }}</span>
        <i :class="copied ? 'i-lucide-check text-accent' : 'i-lucide-copy text-mute'" class="size-3.5 shrink-0" />
      </button>
    </PmCard>

    <PmCard v-if="inviting" class="mb-4" title="Invite someone">
      <div class="space-y-4">
        <AuthField v-model="invite.email" label="Email" type="email" placeholder="colleague@example.com" />
        <PmSelect v-model="invite.role" label="Role" :options="ROLES" />
        <PmAlert v-if="inviteError" tone="danger">{{ inviteError }}</PmAlert>
        <div class="flex gap-2">
          <PmButton variant="primary" :loading="actions.invite.isPending.value" @click="sendInvite">
            Send invitation
          </PmButton>
          <PmButton variant="ghost" @click="inviting = false">Cancel</PmButton>
        </div>
      </div>
    </PmCard>

    <PmAsyncBoundary
      :loading="isPending"
      :error="isError ? (error as unknown as ApiError) : null"
      @retry="refetch"
    >
      <div class="space-y-1.5">
        <div
          v-for="member in members"
          :key="member.uuid"
          class="flex flex-wrap items-center gap-3 rounded-[var(--pm-radius)] border bg-surface px-4 py-3"
        >
          <PmAvatar :src="member.avatar_url" :initials="member.initials" class="shrink-0" />

          <div class="min-w-0 flex-1">
            <p class="flex flex-wrap items-center gap-2 text-[13px] font-medium">
              {{ member.name }}
              <PmBadge v-if="member.is_you" tone="dim" size="sm">you</PmBadge>
              <PmBadge v-if="member.is_owner" tone="accent" size="sm">owner</PmBadge>
            </p>
            <p class="truncate text-[11px] text-mute">
              {{ member.email }}<template v-if="member.job_title"> · {{ member.job_title }}</template>
            </p>
          </div>

          <!--
            The owner's role is fixed: a workspace with no owner has nobody who
            can delete it or change billing. The server refuses too — this just
            avoids offering an action that cannot succeed.
          -->
          <PmSelect
            v-if="canManage && !member.is_owner"
            :model-value="member.role"
            :options="ROLES"
            size="sm"
            class="w-[128px] shrink-0"
            @update:model-value="role => actions.changeRole.mutate({ uuid: member.uuid, role })"
          />
          <span v-else class="w-[128px] shrink-0 text-[13px] text-dim">{{ member.role }}</span>

          <PmButton
            v-if="canManage && !member.is_owner"
            size="sm" variant="ghost"
            :disabled="actions.remove.isPending.value"
            @click="actions.remove.mutate(member.uuid)"
          >
            Remove
          </PmButton>
        </div>
      </div>

      <div v-if="invitations?.length" class="mt-6">
        <h2 class="mb-2 text-[13px] font-semibold uppercase tracking-wide text-dim">
          Pending invitations
        </h2>

        <div class="space-y-1.5">
          <div
            v-for="invitation in invitations"
            :key="invitation.uuid"
            class="flex flex-wrap items-center gap-3 rounded-[var(--pm-radius)] border border-dashed bg-surface px-4 py-3"
          >
            <i-lucide-mail class="size-4 shrink-0 text-mute" />
            <div class="min-w-0 flex-1">
              <p class="truncate text-[13px]">{{ invitation.email }}</p>
              <p class="text-[11px]" :class="invitation.expired ? 'text-[var(--pm-warning)]' : 'text-mute'">
                {{ invitation.expired ? 'Expired — re-invite to refresh it' : `Invited as ${invitation.role}` }}
              </p>
            </div>
            <PmButton
              v-if="canManage"
              size="sm" variant="ghost"
              @click="actions.revoke.mutate(invitation.uuid)"
            >
              Revoke
            </PmButton>
          </div>
        </div>
      </div>
    </PmAsyncBoundary>
  </div>
</template>
