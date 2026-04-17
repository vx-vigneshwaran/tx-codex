# Vezham Platform (TS + Nx + TanStack Start + Vite + HeroUI + Better Auth)

This repo is rebuilt from scratch for a **solo-app architecture** using Nx for orchestration.

## Apps (all standalone)

- `id` → central identity (`id.vezham.com`) with Better Auth + OAuth authorize endpoint.
- `hq` → tenant and workspace entrypoint (`hq.vezham.com`).
- `drive` → file and folder workspace (`drive.vezham.com`).
- `notes` → note-taking workspace (`notes.vezham.com`).
- `remainder` → reminder workspace (`remainder.vezham.com`).
- `schoolos` → standalone product app (`schoolos.vezham.com`).

Each app has its own:

- `package.json`
- `vite.config.ts`
- `tsconfig.json`
- `.env.example`
- source tree

## Stack

- TypeScript
- Nx (pinned to latest stable major/minor in root devDependencies)
- TanStack Start + Vite
- HeroUI v3
- Better Auth
- Neon Postgres

## Run

```bash
pnpm install
pnpm dev:id
pnpm dev:hq
pnpm dev:drive
pnpm dev:notes
pnpm dev:remainder
pnpm dev:schoolos
```

## Environment

Every value is read from environment variables (no hardcoded secrets).
See each app's `.env.example`.

## Security baseline

- Better Auth cookie domain from env (expected `.vezham.com` in prod)
- short-lived OAuth access tokens
- strict redirect allowlist from env
- tenant membership verified server-side for protected handlers
