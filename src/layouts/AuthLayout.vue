<template>
  <div class="grid min-h-screen bg-bg text-fg lg:grid-cols-[minmax(0,480px)_1fr]">
    <div class="flex flex-col justify-center px-8 py-12 sm:px-14">
      <div class="mb-10 flex items-center gap-2.5">
        <PmLogo class="size-8" />
        <span class="text-lg font-semibold">PipeMind</span>
      </div>

      <slot />
    </div>

    <!-- Decorative; hidden below lg so the form is never squeezed. -->
    <div class="relative hidden overflow-hidden border-l bg-sidebar lg:block" aria-hidden="true">
      <div
        class="absolute inset-0 opacity-[0.04]"
        style="background-image: radial-gradient(var(--pm-accent) 1px, transparent 1px); background-size: 22px 22px;"
      />
    </div>
  </div>
</template>
