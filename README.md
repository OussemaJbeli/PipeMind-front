# PipeMind Frontend

Vue 3 + TypeScript + Vite + Tailwind. The visual and interactive layer of PipeMind.

## Setup

```bash
cp .env.example .env
npm install
npm run dev          # http://localhost:5173
```

Requires the backend running on `:8000` (`cd ../PipeMind-back && make up && php artisan serve`).
Vite proxies `/api`, `/sanctum` and `/broadcasting` to it, so Sanctum's cookie
auth works same-origin without CORS configuration.

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Dev server with HMR |
| `npm run build` | Typecheck, then production build |
| `npm run typecheck` | `vue-tsc` only |
| `npm run test` | Vitest |

## Structure

```
src/
├── api/          axios client, vue-query hooks
├── assets/       design tokens + base styles
├── components/   ui · charts · layout · workspace · project · failure
├── composables/  auto-imported
├── layouts/      resolved from route meta.layout
├── router/       routes + guards
├── stores/       auth, ui — client state only
├── types/        api.ts and domain.ts mirror the backend contract
└── views/
```

## Conventions

**Server state lives in vue-query, client state in Pinia.** Pipelines and failures
go stale; auth, theme and sidebar state do not.

**Never re-derive permissions from the role.** The API returns a flat `permissions`
array built from the role matrix. Call `auth.can('remediation.approve')`.

**Colours come from tokens.** Nothing outside `assets/tokens.css` and the metadata
modules may hardcode a hex — the light theme changes the accent for contrast, and
a hardcoded value breaks it.

**Polling is conditional.** Poll only while something is running. An unconditional
interval turns a dashboard into a load generator.

Design targets: `../PipeMind-data/ui/workspace.png` and `ui/project.png`.
Build plan: `../PipeMind-data/roadmaps/`.
