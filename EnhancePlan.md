# GO'EL Enhancement Plan

Roadmap to evolve the current Next.js prototype into a production-ready, Scripture-first community app. Phases are sequenced to deliver a polished landing experience first, then layer in global UX foundations, core features, and launch-readiness work. Each phase assumes mobile-first execution with deliberate tablet and desktop breakpoints.

---

## Phases

- [x] **Phase 1 - Landing Experience Overhaul**
  - Expand the Home page into a mission-forward, conversion-focused overview with hero rotation, mission and vision, feature spotlights, Scripture-only promise, roadmap preview, testimonials, FAQs, secondary CTA banner, and newsletter capture.
  - Align visuals with the pure-black theme, serif verse typography, and gold/olive accents while introducing respectful Framer Motion reveals that honour prefers-reduced-motion.
  - Ship responsive navigation (sticky header, mobile drawer, tablet refinements) and a footer that scales gracefully across breakpoints.
  - Preserve accessibility via semantic headings, aria labels, focus-visible states, and WCAG AA colour contrast.
  - Structure hero verses, testimonials, and FAQs as data arrays so future content updates avoid code rewrites.
  - Deliverables: updated `app/page.tsx`, supporting UI helpers, and responsive QA notes for mobile (<=640px), tablet (641-1024px), and desktop (>=1025px).

- [x] **Phase 2 - Global UI & Scripture Feed Foundation**
  - Codified Tailwind tokens, container defaults, and brand shadows while refining `app/globals.css` for reverent dark-mode theming.
  - Introduced scripture-centered navigation language and typography polish across the landing experience.
  - Reimagined the `/feed` page with a spiritually focused hero, curated filters, and prayer-oriented sidebars to ready the core community space.

- [x] **Phase 3 - Core Scripture Experience (Public & Authenticated)**
  - Integrate the WEB translation pipeline with search, caching strategy, and adapters for future translations.
  - Replace mock feed data with server-driven posts, optimistic Amen/Praying reactions, reporting, and graceful loading states.
  - Build the share workflow (reference search -> preview -> optional reflection) with validation and feature flags.
  - Deliver an immersive passage viewer (theme switcher, font slider, audio hook, copy/share, offline prefetch).
  - Establish auth via email magic link and OAuth (Google, Apple) with server actions.
  - Deliverables: functional `/feed`, `/share`, `/passage/[id]` routes, Prisma schema alignment, and integration tests.

- [x] **Phase 4 - Reading Plans & PWA Enhancements**
  - Implement Verse of the Day and 30-day Gospel plan with progress storage and gentle streak indicators.
  - Configure PWA manifest, icons, caching of the last 50 passages, install prompts, and offline fallbacks.
  - Add opt-in reminders for daily Scripture engagement.
  - Deliverables: `/plans` route, plan APIs, Lighthouse PWA audit notes, and documented offline behaviour.

- [x] **Phase 5 - Prayer Groups & Moderation Suite**
  - Create prayer group directory, membership flow (<=25 members), request posting, Praying reactions, and 30-day archival.
  - Ship mobile-first group threads with typing affordances and quiet notifications.
  - Build `/admin/reports` for moderation triage with hide/warn/suspend actions and audit logging.
  - Layer in safety tooling (rate limits, spam heuristics, moderation analytics).
  - Deliverables: group/admin routes, finalised Prisma models, and end-to-end moderation tests.

- [ ] **Phase 6 - Production Infrastructure & Observability**
  - Configure CI/CD for lint, type-check, tests, and build; define deployment targets (Vercel front end, PlanetScale/Postgres, storage).
  - Enforce security (server-side validation, CSRF, hardened sessions, secrets management, licence notices).
  - Add observability with Sentry, structured logging, engagement analytics, and Core Web Vitals capture.
  - Optimise performance with code-splitting, image tuning, motion lazy-loading, and profiling.
  - Document operations: runbooks, architecture diagrams, retention policies, and attribution guidelines.

- [ ] **Phase 7 - Launch Hardening & Growth**
  - Conduct QA sweeps across devices/browsers, manual accessibility testing, and security review.
  - Finalise content (copy, Scripture attributions, onboarding flows, support contacts).
  - Produce marketing assets (press kit, brand exports), integrate newsletter/waitlist tooling, and outline partnership outreach.
  - Prepare launch checklist with smoke tests, rollback plan, dashboards, and post-launch monitoring.

---

### Supporting Workstreams (Parallel)
- **Design collaboration:** Maintain Figma/source-of-truth with responsive specs and motion prototypes.
- **Data & licensing:** Track translation licences, API quotas, and audio sourcing agreements.
- **Community standards:** Finalise Code of Conduct, moderation escalation paths, and volunteer onboarding materials.

---

This plan keeps the landing overhaul as the immediate priority while sequencing subsequent phases to deliver the full GO'EL vision with a production-grade foundation across mobile, tablet, and desktop.
