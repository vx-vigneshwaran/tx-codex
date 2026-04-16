# Vezham SaaS Monorepo (TypeScript + Nx Bootstrap)

This repository provides a runnable **TypeScript + Nx** bootstrap for the Vezham identity + multi-tenant architecture.

## Apps

- `apps/id`: identity app (login + OAuth authorize)
- `apps/hq`: tenant-aware app
- `apps/apps`: additional app endpoint
- `apps/schoolos`: additional app endpoint

## Shared packages

- `packages/core`: typed auth, OAuth, session, and tenant helpers
- `packages/db`: Neon/Postgres schema + Better Auth adapter example

## Nx quick start

```bash
pnpm install
pnpm dev:id
pnpm dev:hq
pnpm dev:apps
pnpm dev:schoolos
```

Equivalent Nx commands:

```bash
pnpm nx run id:serve
pnpm nx run hq:serve
```

## OAuth flow

1. `POST /login` on `id` creates session.
2. SSO cookie is set with `Domain=.vezham.com`, `HttpOnly`, `Secure`, `SameSite=Lax`.
3. App redirects to `GET /api/oauth/authorize?app=hq&redirect=...`.
4. `id` validates session and redirect allowlist.
5. `id` issues short-lived JWT with `sub`, `app`, `scopes`, `exp`.
6. `hq` verifies token and enforces tenant membership on `/t/:tenantSlug`.

## Tenant isolation rules

- Never trust tenant slug from frontend alone.
- Validate membership server-side every request.
- Filter data by tenant identifier in backend queries.

## Environment

```env
DATABASE_URL=postgres://...
JWT_SECRET=replace-me
BETTER_AUTH_SECRET=replace-me
```

## Test

```bash
pnpm test
```
