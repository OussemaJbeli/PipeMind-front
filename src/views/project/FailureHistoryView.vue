<script setup lang="ts">
import type { ApiError } from '@/api/client'
import { useSignatures } from '@/api/queries/pipelines'
import { CATEGORY_META } from '@/composables/useCategoryMeta'

const props = defineProps<{ slug: string }>()

const category = ref('')
const knownOnly = ref(false)

const { data, isPending, isError, error, refetch } = useSignatures(
  () => props.slug,
  computed(() => ({ category: category.value, known: knownOnly.value })),
)

const rows = computed(() => data.value?.data ?? [])

const categoryOptions = [
  { key: '', label: 'All categories' },
  ...Object.entries(CATEGORY_META).map(([key, meta]) => ({ key, label: meta.label })),
]
</script>

<template>
  <div class="mx-auto max-w-[1500px]">
    <div class="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 class="text-xl font-semibold">
          Failure history
        </h1>
        <!--
          Signatures, not failures. The same error forty times is one entry with
          a count — which is the shape the information actually has, and the view
          that makes recurring problems obvious.
        -->
        <p class="mt-1 text-sm text-dim">
          {{ rows.length }} distinct error signature(s) seen in this project.
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <PmSelect v-model="category" :options="categoryOptions" size="sm" />
        <PmToggle v-model="knownOnly" label="Known fixes only" />
      </div>
    </div>

    <PmAsyncBoundary
      :loading="isPending"
      :error="isError ? (error as unknown as ApiError) : null"
      :empty="!rows.length"
      empty-title="No history yet"
      empty-message="Signatures accumulate as PipeMind sees failures. This is the knowledge base."
      @retry="refetch"
    >
      <div class="space-y-2">
        <SignatureRow v-for="row in rows" :key="row.uuid" :signature="row" :slug="slug" />
      </div>
    </PmAsyncBoundary>
  </div>
</template>
