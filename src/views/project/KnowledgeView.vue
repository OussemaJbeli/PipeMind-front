<script setup lang="ts">
import type { ApiError } from '@/api/client'
import {
  KNOWLEDGE_TYPES,
  useDeleteKnowledge,
  useKnowledge,
  useKnowledgeDocument,
  useReindexKnowledge,
  useSaveKnowledge,
  type KnowledgeDocument,
  type KnowledgeType,
} from '@/api/queries/knowledge'
import { useAuthStore } from '@/stores/auth'

const props = defineProps<{ slug: string }>()

const auth = useAuthStore()
const canManage = computed(() => auth.can('knowledge.manage'))

const { data: documents, isPending, isError, error, refetch } = useKnowledge(() => props.slug)
const save = useSaveKnowledge(() => props.slug)
const remove = useDeleteKnowledge(() => props.slug)
const reindex = useReindexKnowledge(() => props.slug)

/* ── editor ──────────────────────────────────────────────────────────── */

// null = closed, '' = creating, uuid = editing. One ref rather than a boolean
// plus an id, so "open on nothing" cannot be represented.
const editing = ref<string | null>(null)
const { data: loaded, isPending: loadingContent } = useKnowledgeDocument(
  computed(() => (editing.value ? editing.value : null)),
)

const form = reactive({
  type: 'runbook' as KnowledgeType,
  title: '',
  content: '',
  source_url: '',
  team_wide: false,
})

const saveError = ref<string | null>(null)
const fieldErrors = ref<Record<string, string[]>>({})

function openCreate() {
  editing.value = ''
  saveError.value = null
  fieldErrors.value = {}
  Object.assign(form, { type: 'runbook', title: '', content: '', source_url: '', team_wide: false })
}

function openEdit(document: KnowledgeDocument) {
  editing.value = document.uuid
  saveError.value = null
  fieldErrors.value = {}
  // Content arrives from the detail request; seeded by the watcher below so the
  // editor is never briefly populated with the previous document's text.
  Object.assign(form, {
    type: document.type,
    title: document.title,
    content: '',
    source_url: document.source_url ?? '',
    team_wide: document.team_wide,
  })
}

watch(loaded, (document) => {
  if (document && document.uuid === editing.value)
    form.content = document.content
})

function close() {
  editing.value = null
}

const typeHint = computed(() =>
  KNOWLEDGE_TYPES.find(t => t.key === form.type)?.hint ?? '')

// Mirrors the server's chunker closely enough to be useful, not to be exact:
// the point is to show that a two-line note will not retrieve well.
const estimatedChunks = computed(() =>
  Math.max(1, Math.ceil(form.content.trim().length / 4 / 150)))

const tooShort = computed(() => form.content.trim().length > 0 && form.content.trim().length < 120)

function submit() {
  saveError.value = null
  fieldErrors.value = {}

  save.mutate({
    uuid: editing.value || undefined,
    type: form.type,
    title: form.title.trim(),
    content: form.content,
    source_url: form.source_url.trim() || null,
    team_wide: form.team_wide,
  }, {
    onSuccess: close,
    onError: (thrown) => {
      const failure = thrown as unknown as ApiError
      saveError.value = failure.message
      fieldErrors.value = failure.validation ?? {}
    },
  })
}

/* ── destructive actions ─────────────────────────────────────────────── */

const confirming = ref<string | null>(null)

function confirmDelete(uuid: string) {
  remove.mutate(uuid, { onSettled: () => (confirming.value = null) })
}

const indexing = computed(() => (documents.value ?? []).filter(d => !d.indexed_at).length)

function typeLabel(type: KnowledgeType) {
  return KNOWLEDGE_TYPES.find(t => t.key === type)?.label ?? type
}
</script>

<template>
  <div class="mx-auto max-w-[900px]">
    <div class="flex items-start justify-between gap-4">
      <div>
        <h1 class="text-xl font-semibold">Knowledge</h1>
        <p class="mt-1 max-w-[58ch] text-sm text-dim">
          What your team knows that a model cannot infer from a log. Indexed
          documents are searched during every analysis, and a matching passage is
          quoted in the answer.
        </p>
      </div>

      <PmButton v-if="canManage" variant="primary" @click="openCreate">
        <i-lucide-plus class="size-4" />Add document
      </PmButton>
    </div>

    <PmAsyncBoundary
      class="mt-5"
      :loading="isPending"
      :error="isError ? (error as unknown as ApiError) : null"
      @retry="refetch"
    >
      <template #default>
        <PmAlert v-if="indexing" tone="info" class="mb-4">
          {{ indexing }} document{{ indexing === 1 ? '' : 's' }} still indexing. Until
          that finishes they are not retrievable, so analyses will not use them yet.
        </PmAlert>

        <PmEmptyState
          v-if="!documents?.length"
          icon="i-lucide-book-open"
          title="No documents yet"
          message="A runbook that names an exact error and its fix is the single most
                   valuable thing you can add — it turns a guess into a citation."
        />

        <div v-else class="space-y-3">
          <PmCard v-for="document in documents" :key="document.uuid" hoverable>
            <div class="flex items-start gap-4">
              <PmIconTile icon="i-lucide-file-text" class="mt-0.5 shrink-0" />

              <div class="min-w-0 flex-1">
                <div class="flex flex-wrap items-center gap-2">
                  <h2 class="truncate text-[15px] font-medium">{{ document.title }}</h2>
                  <PmBadge tone="dim">{{ typeLabel(document.type) }}</PmBadge>

                  <!--
                    Stated on the row because scope changes which analyses can
                    see it, and that is not otherwise visible anywhere.
                  -->
                  <PmBadge v-if="document.team_wide" tone="accent">All projects</PmBadge>

                  <PmBadge v-if="!document.indexed_at" tone="warning">
                    <i-lucide-loader-circle class="size-3 animate-spin" />Indexing
                  </PmBadge>
                  <PmBadge v-else tone="success">
                    {{ document.chunks_count }} chunk{{ document.chunks_count === 1 ? '' : 's' }}
                  </PmBadge>
                </div>

                <p class="mt-1.5 line-clamp-2 text-xs leading-relaxed text-dim">
                  {{ document.excerpt }}
                </p>

                <p class="mt-2 text-[11px] text-mute">
                  v{{ document.version }} · {{ document.token_count }} tokens
                  <template v-if="document.created_by"> · {{ document.created_by }}</template>
                  <template v-if="document.source_url">
                    ·
                    <a
                      :href="document.source_url"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="underline hover:text-fg"
                    >source</a>
                  </template>
                </p>
              </div>

              <div v-if="canManage" class="flex shrink-0 items-center gap-1">
                <PmButton variant="ghost" size="sm" @click="openEdit(document)">
                  <i-lucide-pencil class="size-3.5" />
                </PmButton>
                <PmTooltip content="Re-chunk and re-embed">
                  <PmButton
                    variant="ghost"
                    size="sm"
                    :loading="reindex.isPending.value && reindex.variables.value === document.uuid"
                    @click="reindex.mutate(document.uuid)"
                  >
                    <i-lucide-refresh-cw class="size-3.5" />
                  </PmButton>
                </PmTooltip>
                <PmButton variant="ghost" size="sm" @click="confirming = document.uuid">
                  <i-lucide-trash-2 class="size-3.5 text-[color:var(--pm-danger)]" />
                </PmButton>
              </div>
            </div>

            <!--
              Inline rather than a modal: the row states what is about to be
              destroyed, and a dialog that covers it would hide the answer to
              "which one?".
            -->
            <div
              v-if="confirming === document.uuid"
              class="mt-3 flex flex-wrap items-center gap-3 rounded-[var(--pm-radius)] border border-[color:var(--pm-danger)]/30 bg-surface-2 p-3"
            >
              <p class="flex-1 text-xs text-dim">
                Delete <span class="font-medium text-fg">{{ document.title }}</span> and its
                {{ document.chunks_count }} indexed chunk{{ document.chunks_count === 1 ? '' : 's' }}.
                Analyses already citing it keep their text; future ones lose it.
              </p>
              <PmButton variant="ghost" size="sm" @click="confirming = null">Cancel</PmButton>
              <PmButton
                variant="danger"
                size="sm"
                :loading="remove.isPending.value"
                @click="confirmDelete(document.uuid)"
              >
                Delete
              </PmButton>
            </div>
          </PmCard>
        </div>
      </template>
    </PmAsyncBoundary>

    <!-- ── editor ──────────────────────────────────────────────────── -->
    <PmCard v-if="editing !== null" class="mt-5" :title="editing ? 'Edit document' : 'New document'">
      <div class="space-y-4">
        <PmSelect
          v-model="form.type"
          label="Type"
          :options="KNOWLEDGE_TYPES.map(t => ({ key: t.key, label: t.label }))"
        />
        <p class="-mt-2 text-xs text-mute">{{ typeHint }}</p>

        <AuthField
          v-model="form.title"
          label="Title"
          :errors="fieldErrors.title"
          hint="Name the error it solves, not the topic. 'SQLSTATE 2002 connection refused' retrieves; 'Database notes' does not."
        />

        <AuthField
          v-model="form.source_url"
          label="Source URL"
          :required="false"
          :errors="fieldErrors.source_url"
          hint="Optional. Where this came from, so a reader can check it."
        />

        <div>
          <label for="knowledge-content" class="mb-1.5 block text-[13px] font-medium">Content</label>
          <textarea
            id="knowledge-content"
            v-model="form.content"
            rows="16"
            :disabled="loadingContent && Boolean(editing)"
            class="w-full rounded-[var(--pm-radius)] border bg-surface-2 p-3 font-mono text-xs leading-relaxed outline-none focus:border-[color:var(--pm-accent)] disabled:opacity-50"
            placeholder="## SQLSTATE[HY000] [2002] Connection refused&#10;&#10;**Symptom.** …&#10;**Cause.** …&#10;**Fix.** …"
          />
          <p v-if="fieldErrors.content" class="mt-1 text-xs text-[color:var(--pm-danger)]">
            {{ fieldErrors.content[0] }}
          </p>

          <!--
            Retrieval reality, shown while writing rather than discovered later:
            documents are split into ~150-token chunks and each is matched
            independently, so a passage that names its error retrieves and a
            vague one does not.
          -->
          <p class="mt-1.5 text-[11px] text-mute">
            ≈ {{ estimatedChunks }} chunk{{ estimatedChunks === 1 ? '' : 's' }}.
            Each is matched on its own, so repeat the error text in the section that fixes it.
          </p>
          <PmAlert v-if="tooShort" tone="warning" class="mt-2">
            Very short documents rarely retrieve — there is not enough text for a
            close match. Include the error message verbatim and what to change.
          </PmAlert>
        </div>

        <PmToggle
          v-model="form.team_wide"
          label="Available to every project"
          description="Use for conventions that hold everywhere. Project documents rank above team-wide ones at equal relevance."
        />

        <PmAlert v-if="saveError" tone="danger">{{ saveError }}</PmAlert>

        <div class="flex items-center gap-3">
          <PmButton
            variant="primary"
            :loading="save.isPending.value"
            :disabled="!form.title.trim() || !form.content.trim()"
            @click="submit"
          >
            {{ editing ? 'Save and re-index' : 'Create and index' }}
          </PmButton>
          <PmButton variant="ghost" @click="close">Cancel</PmButton>

          <p v-if="editing" class="text-xs text-mute">
            Re-indexing only happens if the text actually changed.
          </p>
        </div>
      </div>
    </PmCard>
  </div>
</template>
