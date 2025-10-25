# GO'EL

> GO'EL — Scripture-first community for reading, sharing, and praying together.

A Next.js 13 (App Router) TypeScript application focused on Scripture-centered fellowship. It uses Tailwind CSS for styling, Prisma for database schema (PostgreSQL), and Supabase client libraries for certain integrations.

## Tech stack

- Next.js 13 (App Router)
- TypeScript
- Tailwind CSS
- Prisma (PostgreSQL)
- Supabase JS
- Framer Motion, lucide-react, shadcn-style UI components

## Quick start

Prerequisites:

- Node.js (18+ recommended)
- npm (or pnpm/yarn)
- PostgreSQL (for local development) or a managed Postgres provider

1. Install dependencies

```powershell
cd d:\go-el\project
npm install
```

2. Setup environment variables

Create a `.env` file in the project root and provide at least the following variables:

- `DATABASE_URL` — PostgreSQL connection string used by Prisma.
- `NEXT_PUBLIC_SUPABASE_URL` — (if using Supabase in the frontend) your Supabase URL.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — (if using Supabase in the frontend) anon key.
- `SUPABASE_SERVICE_ROLE_KEY` — (optional) service role key for server operations when required.

Example `.env` (do NOT commit secrets):

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/goel"
NEXT_PUBLIC_SUPABASE_URL="https://xyz.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="public-anon-key"
SUPABASE_SERVICE_ROLE_KEY="service-role-key"
```

3. Prisma setup

Generate the Prisma client (required):

```powershell
npx prisma generate
```

If you want to apply migrations (if you have migrations in `prisma/migrations`):

```powershell
npx prisma migrate dev --name init
```

Or to push the current schema to your database without migrations (useful for prototyping):

```powershell
npx prisma db push
```

4. Run the app (development)

```powershell
npm run dev
```

Open http://localhost:3000

## Scripts

- `npm run dev` — Run the Next.js dev server
- `npm run build` — Build for production
- `npm run start` — Start the production server after build
- `npm run lint` — Run ESLint
- `npm run typecheck` — Run TypeScript typecheck

## Database & Seeding

- The Prisma schema is in `prisma/schema.prisma`.
- The app expects a PostgreSQL database referenced by `DATABASE_URL`.
- There is a seeding helper in `lib/server/seed.ts` (inspect before running). You can run it manually (ts-node/compiled) to populate sample data.

## Tests

Integration tests appear under `tests/integration`. There is no top-level `test` script in `package.json`; to run tests you may need to install and configure the test runner used by your team (Vitest / Jest / Playwright etc.).

## Deployment

- This project is a standard Next.js app — it can be deployed to Vercel, Netlify (with Next.js adapter), or other Node hosting providers.
- Ensure environment variables (DATABASE_URL, Supabase keys) are set in your deployment environment.
- If you deploy to Vercel, set `NEXT_PUBLIC_*` env vars in the Vercel dashboard and add `DATABASE_URL` as a secret.

## Notes & recommendations

- Line endings: the repo was committed from Windows and Git may warn about LF/CRLF. Consider adding a `.gitattributes` to normalize line endings (I can add one if you want).
- Add a `README` section for contributing, code structure, and how to run integration tests if you want this repo to be contributor-friendly.

## Where to look

- `app/` — Next.js App Router pages and UI
- `components/` — Reusable UI components and design system
- `lib/` — Utilities, server helpers (including `lib/server`), scripture data
- `prisma/` — Prisma schema
- `tests/integration` — integration tests

---

If you'd like, I can also:

- Add a `.gitattributes` to enforce LF line endings
- Add a short CONTRIBUTING.md
- Wire up a simple GitHub Action to run lint/typecheck on push

Tell me which of those you'd like and I will add, commit, and push them.
