<script setup lang="ts">
import { ref, watch } from 'vue'

import { useWebhookSettings } from '@/api/queries/integrations'

const emit = defineEmits<{ apply: [url: string] }>()

const { data: settings } = useWebhookSettings()
const url = ref('')

watch(settings, (value) => {
  if (value && !url.value)
    url.value = value.webhook_base_url
}, { immediate: true })
</script>

<template>
  <PmCard title="Public webhook URL" subtitle="Where providers send pipeline events">
    <!--
      A free cloudflared or ngrok tunnel gets a NEW hostname on every restart.
      Keeping this editable here means pasting the current URL and re-registering,
      rather than editing .env and redeploying.
    -->
    <PmAlert v-if="settings && !settings.reachable" tone="warning" class="mb-4">
      <strong>Not reachable from the internet.</strong>
      Providers cannot deliver webhooks to <code class="font-mono">{{ settings.webhook_base_url }}</code>.
      Start a tunnel and paste its URL below.
    </PmAlert>

    <PmInput
      v-model="url"
      label="Base URL"
      placeholder="https://your-tunnel.trycloudflare.com"
      icon="i-lucide-globe"
      hint="Or run `php artisan pipemind:tunnel` — it starts the tunnel and re-registers every webhook automatically."
    />

    <PmButton
      variant="primary"
      size="sm"
      class="mt-4"
      :disabled="!url.trim() || url.trim() === settings?.webhook_base_url"
      @click="emit('apply', url.trim())"
    >
      <i-lucide-refresh-cw class="size-3.5" /> Save &amp; re-register all webhooks
    </PmButton>
  </PmCard>
</template>
