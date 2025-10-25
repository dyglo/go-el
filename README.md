# GO'EL

GO'EL is a Scripture-first community application for reading, sharing, and praying together.

Overview
--------

GO'EL is built with the Next.js App Router and TypeScript. The project focuses on a quiet, Scripture-centered experience and uses Prisma (PostgreSQL) for the data model and Supabase client libraries for select integrations. The UI uses Tailwind CSS and several component libraries (lucide-react, Framer Motion, shadcn-style components).

Highlights
----------

- Scripture-focused feed and prayer rooms
- Lightweight, accessible UI designed for mobile-first usage
- Server-side helpers and Prisma-backed Postgres schema

Tech stack
----------

- ⚛️ React 18
- 🟦 TypeScript
- 🟣 Next.js 13 (App Router)
- 🎨 Tailwind CSS
- 🧭 Framer Motion (animations)
- 🖼 lucide-react (icons)
- 🧱 Prisma (PostgreSQL)
- 🐘 PostgreSQL (database)
- 🟩 Supabase (client libraries)
- 🔒 Optional: Vaul / zod for validation and secrets

Prerequisites
-------------

- Node.js 18+ (or the version your team targets)
- npm, pnpm, or yarn
- A PostgreSQL database for local development or a managed provider

Quick start
-----------

1. Install dependencies

```powershell
cd d:\\go-el\\project
npm install
```

2. Create a `.env` file

Required environment variables used in the codebase:

- `DATABASE_URL` — Postgres connection string used by Prisma
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL (if used)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon/public key (if used)
- `SUPABASE_SERVICE_ROLE_KEY` — Service role key for server-side operations (keep secret)

Example `.env` (do not commit):

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/goel"
NEXT_PUBLIC_SUPABASE_URL="https://xyz.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="public-anon-key"
SUPABASE_SERVICE_ROLE_KEY="service-role-key"
```

3. Generate Prisma client

```powershell
npx prisma generate
```

4. (Optional) Apply migrations or push schema

```powershell
npx prisma migrate dev --name init
# or for pushing schema without migrations
npx prisma db push
```

5. Run the development server

```powershell
npm run dev
```

Open http://localhost:3000

Scripts
-------

- `npm run dev` — Start Next.js in development
- `npm run build` — Build for production
- `npm run start` — Start the production server (after build)
- `npm run lint` — Run ESLint
- `npm run typecheck` — Run TypeScript typecheck

Database & seeding
------------------

- Prisma schema is located at `prisma/schema.prisma`.
- The project includes a seeding helper in `lib/server/seed.ts`. Review before running and use appropriate tools (ts-node or compiled code) to execute seeding.

Tests
-----

- Integration tests are in `tests/integration`. There is no single test runner configured in `package.json`; add or configure your preferred test runner (Jest, Vitest, Playwright) if you intend to run those tests locally or in CI.

Deployment
----------

- Deploy like a standard Next.js app (Vercel is recommended for first-class support).
- Ensure environment variables are configured in the hosting provider (DATABASE_URL, Supabase keys, etc.).

Repository layout (quick)
------------------------

- `app/` — Next.js App Router routes and pages
- `components/` — UI components and design system
- `lib/` — Utilities and server helpers (including `lib/server`)
- `prisma/` — Prisma schema
- `tests/integration` — Integration tests

Notes
-----

- The repository was initialized from a Windows environment; you may see LF/CRLF messages from Git. Adding a `.gitattributes` file to normalize line endings is recommended for cross-platform consistency.

Contact
-------

For questions about development or contributing, open an issue or reach out to the project maintainers.

