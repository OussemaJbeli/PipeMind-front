<script setup lang="ts">
import type { AiUsage } from '@/api/queries/workspaceAdmin'

const props = defineProps<{ usage: AiUsage }>()

function money(usd: number) {
  return usd > 0 && usd < 0.01 ? `$${usd.toFixed(4)}` : `$${usd.toFixed(2)}`
}

const ratio = computed(() => props.usage.budget_used_ratio ?? 0)

const tone = computed(() =>
  ratio.value >= 0.9
    ? 'var(--pm-danger)'
    : ratio.value >= 0.75 ? 'var(--pm-warning)' : 'var(--pm-accent)')

// Straight-line from spend so far. Labelled a projection, not a forecast — it
// assumes the rest of the month looks like the part already spent.
const overBudget = computed(() =>
  props.usage.monthly_budget_usd > 0
  && props.usage.projected_month_end_usd > props.usage.monthly_budget_usd)
</script>

<template>
  <PmCard title="AI usage" :subtitle="`Month to date · ${usage.range_days}-day activity`">
    <div>
      <p class="text-2xl font-semibold tnum">
        {{ money(usage.month_to_date_usd) }}
        <span class="text-base font-normal text-dim">
          of {{ money(usage.monthly_budget_usd) }}
        </span>
      </p>

      <div class="mt-3 h-2 overflow-hidden rounded-full bg-[var(--pm-surface-3)]">
        <div
          class="h-full rounded-full transition-all"
          :style="{ width: `${Math.max(1, ratio * 100)}%`, background: tone }"
        />
      </div>

      <p class="mt-1.5 text-xs text-mute">
        <template v-if="usage.budget_used_ratio === null">
          No ceiling set — analyses will run until the provider stops you.
        </template>
        <template v-else>
          {{ Math.round(ratio * 100) }}% used · projected month-end
          <span :class="overBudget ? 'font-medium text-[var(--pm-warning)]' : ''">
            {{ money(usage.projected_month_end_usd) }}
          </span>
        </template>
      </p>

      <dl class="mt-5 grid grid-cols-2 gap-4 border-t pt-4 sm:grid-cols-4">
        <div>
          <dt class="text-[11px] uppercase tracking-wider text-mute">Analyses</dt>
          <dd class="mt-0.5 text-lg font-semibold tnum">{{ usage.requests }}</dd>
        </div>
        <div>
          <dt class="text-[11px] uppercase tracking-wider text-mute">Tokens</dt>
          <dd class="mt-0.5 text-lg font-semibold tnum">{{ usage.tokens.toLocaleString() }}</dd>
        </div>
        <div>
          <dt class="text-[11px] uppercase tracking-wider text-mute">
            <PmTooltip content="Reused analyses call no model and cost nothing. This is the number that shows whether caching earns its complexity.">
              <span>Cache hits</span>
            </PmTooltip>
          </dt>
          <dd class="mt-0.5 text-lg font-semibold tnum">{{ Math.round(usage.cache_hit_rate * 100) }}%</dd>
        </div>
        <div>
          <dt class="text-[11px] uppercase tracking-wider text-mute">Avg latency</dt>
          <dd class="mt-0.5 text-lg font-semibold tnum">{{ (usage.avg_latency_ms / 1000).toFixed(1) }}s</dd>
        </div>
      </dl>

      <!--
        Surfaced rather than buried: a third of calls failing is the difference
        between a working feature and one that looks like it works.
      -->
      <PmAlert v-if="usage.error_rate > 0.1" tone="warning" class="mt-4">
        {{ Math.round(usage.error_rate * 100) }}% of AI calls failed in this window.
        Check the provider's status and quota below.
      </PmAlert>

      <div v-if="usage.by_model.length" class="mt-5 border-t pt-4">
        <p class="text-[11px] uppercase tracking-wider text-mute">Spend by model</p>
        <ul class="mt-2 space-y-1.5">
          <li
            v-for="row in usage.by_model"
            :key="`${row.provider}/${row.model}`"
            class="flex items-center gap-3 text-[13px]"
          >
            <span class="min-w-0 flex-1 truncate">
              {{ row.model }}
              <span class="text-mute">· {{ row.provider }}</span>
            </span>
            <span class="shrink-0 text-[11px] text-mute">{{ row.calls }} calls</span>
            <span class="w-[68px] shrink-0 text-right tnum">{{ money(row.cost_usd) }}</span>
          </li>
        </ul>
      </div>
    </div>
  </PmCard>
</template>
