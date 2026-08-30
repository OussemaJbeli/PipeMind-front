<template>
  <div class="grid min-h-screen place-items-center px-6 text-center">
    <div>
      <p class="text-[64px] font-semibold leading-none text-accent">404</p>
      <p class="mt-4 text-lg font-medium">Page not found</p>
      <p class="mt-1 text-sm text-dim">The page you're looking for doesn't exist.</p>
      <RouterLink
        :to="{ name: 'workspace' }"
        class="mt-6 inline-flex h-10 items-center rounded-[var(--pm-radius)] bg-accent px-4 text-sm font-semibold text-[var(--pm-on-accent)]"
      >
        Back to workspace
      </RouterLink>
    </div>
  </div>
</template>
