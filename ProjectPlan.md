Here’s your complete **v0.app “context document”** for your project — polished, ready to paste directly into v0 as the **Context / PRD input**.
It’s tailored for **Next.js 15+**, **Framer Motion**, and a **pure-black background theme**.
The app name is **GO’EL** (“Redeemer” in Hebrew).

---

# 🕊️ GO’EL — Christian Community Scripture Web App

**Framework:** Next.js 15+ (App Router)
**Stack:** TypeScript, Tailwind CSS, shadcn/ui, Prisma (PlanetScale / Postgres), Framer Motion
**Purpose:** Build a reverent, beautiful, Scripture-only Christian community web app for the glory of God.

---

## 1. Product Vision

**Mission:**
GO’EL is a global Christian community app where believers can share, read, and meditate on *only Scripture*. No ads, no noise—just the Word and fellowship in faith.

**Values:**

* Christ-centered simplicity.
* Scripture > opinion.
* Reverent design, free access.
* Community growth in faith through the Word.

**Key Design Principles:**

* Minimalist UI on **pure black** background for dark mode.
* Smooth transitions with **Framer Motion** for reverent, calm flow.
* Typography-driven (serif for verses, clean sans-serif for UI).
* Optimized for mobile / PWA use worldwide.

---

## 2. MVP Scope (First Release)

### Core Features

1. **Home Feed** — stream of Scripture shares (passage + optional 160-char reflection, toggleable).
2. **Passage Viewer** — large, readable view with theme, font size, audio playback.
3. **Share Scripture** — reference search → preview → post.
4. **Reading Plans** — Verse of the Day + 30-day Gospel plan.
5. **Prayer Groups** — small private rooms (≤ 25 members) for prayer requests with 🙏 reactions.
6. **Moderation** — report > review > hide / warn / suspend.
7. **Auth** — email magic link / OAuth (Google + Apple).
8. **PWA** — offline last 50 passages, installable.

### Deferred (Phase 2)

* Comments, DMs, media uploads, multi-translation sync.

---

## 3. Architecture

**Public:** Landing → Explore → Passage Pages → Sign Up
**Private:** Feed → Share → Plans → Groups → Profile
**Admin:** Reports → Actions → User Management

---

## 4. Scripture Licensing

| Translation                   | License                                             | Recommendation |
| ----------------------------- | --------------------------------------------------- | -------------- |
| **World English Bible (WEB)** | Public Domain                                       | ✅ Default      |
| **KJV**                       | Public Domain (ex UK)                               | Optional       |
| **ESV**                       | Crossway API (non-commercial license + attribution) | Future         |
| **API.Bible / Bible Brain**   | Licensed APIs for multi-translation & audio         | Phase 2        |

MVP uses **WEB** to avoid licensing friction.

---

## 5. Prompt Pack for v0.app

### 🔧 System / Project Brief

> Build a **Next.js 15+ PWA** called **GO’EL**, a Scripture-only Christian community.
> Core actions: **Read**, **Share**, **Pray**.
> Only Bible text in the public feed.
> Design aesthetic: reverent & modern on **pure black background**, serif verse typography, golden/olive accents, subtle Framer Motion animations.
> Use **Tailwind CSS + shadcn/ui** for layout.
> Mobile-first, accessible (WCAG AA), fast, server actions, optimistic UI.

---

### 📄 Page-by-Page Prompts

#### **Landing Page**

> Responsive landing with rotating hero verse, three pillars (Read | Share | Pray), CTA buttons (“Enter GO’EL”, “Today’s Verse”).
> Footer: statement of faith + Scripture sources (WEB PD notice).

#### **Feed**

> Scrollable scripture feed (black background).
> Cards: verse reference + text (clamped → “Expand”), poster name, time, 🙏 reaction, share button, report button.
> Gentle fade-in via Framer Motion.

#### **Share Flow**

> 3-step: Search/paste reference → preview → optional reflection (max 160 chars).
> Reflection toggle controlled by feature flag.
> Smooth transitions with Framer Motion.

#### **Passage Viewer**

> Large, calm reading UI; theme switch (black / sepia / light), font slider, copy/share, audio if available.

#### **Reading Plans**

> Verse of the Day + 30-day Gospel plan checklist; local progress.

#### **Prayer Groups**

> Private threads (≤ 25 users); “Add Request” (title + one line). Reaction = “Praying”.
> Requests auto-archive after 30 days.

#### **Moderation**

> Admin queue of reports with filters and quick actions (hide, warn, suspend). Show Code of Conduct acceptance modal on first post.

---

### 🎨 Design Tokens

* **Background:** #000000 (pure black)
* **Text (primary):** #FFFFFF
* **Accents:** #D4AF37 (golden) and #708238 (olive)
* **Typography:** Serif for verses (Merriweather or Playfair Display); Sans-serif for UI (Inter).
* **Components:** rounded-2xl, shadow-soft, motion-fade/slide.
* **Iconography:** lucide-react line icons.
* **Motion:** Framer Motion fade/scale on entry and page transitions.

---

### 🧭 UX & Accessibility Guidelines

> Core Web Vitals optimized; semantic headings; visible focus; ARIA labels; prefers-reduced-motion respect.
> PWA caching (last 50 passages); Server Actions for mutations.

---

### 📜 Empty States & Tone

> Empty feed → “Share the first verse and let the Word shine.”
> Calm, biblically anchored tone—short, hopeful, never pushy.
> Buttons say “Amen”, “Praying”, not “Like”.

---

### ⚖️ Attribution Footer

> “Scripture quotes from the World English Bible (Public Domain).”
> If ESV enabled: include Crossway attribution and license link.

---

## 6. Data Model

| Entity            | Key Fields                                                        |
| ----------------- | ----------------------------------------------------------------- |
| **User**          | id, email, displayName, role, acceptedCodeOfConductAt             |
| **Passage**       | id, reference, translation, text, audioUrl?                       |
| **Post**          | id, userId, passageId, reflection?, visibility, status, createdAt |
| **Reaction**      | id, postId, userId, type (amen / praying)                         |
| **Report**        | id, postId, reporterId, reason, status                            |
| **Group**         | id, name, ownerId, memberCount                                    |
| **PrayerRequest** | id, groupId, userId, title, createdAt, archivedAt?                |
| **PlanProgress**  | id, userId, planId, dayIndex, completedAt                         |

---

## 7. Moderation & Conduct

**Code of Conduct** — Respect, edification, Scripture-only, no self-promotion or politics.
**Enforcement Flow:** Report → Admin review → Hide/Warn/Mute → Audit log.
**Safety:** Rate limits, spam filters, family-friendly default.

---

## 8. Growth & Retention

* Daily “Open the Word” PWA reminder (opt-in).
* Reading streak (soft indicator, no pressure).
* “Invite to Prayer Group” after 3 days active.
* Seasonal reading plans (Advent, Lent).

---

## 9. Development Roadmap (8 Weeks)

| Sprint                             | Focus                                 | Deliverables                                    |
| ---------------------------------- | ------------------------------------- | ----------------------------------------------- |
| **0 – Design**                     | Generate UIs in v0 (via this doc)     | Landing, Feed, Share, Viewer, Plans, Groups UIs |
| **1 – Scripture Pipeline**         | Integrate WEB text + search engine    | Passage view + share flow                       |
| **2 – Feed + Auth**                | Magic link auth + Server Actions feed | Post / React / Report flows                     |
| **3 – Reading Plans + PWA**        | Verse of Day + offline caching        | PWA install prompt                              |
| **4 – Prayer Groups + Moderation** | Private threads + admin queue         | Groups MVP + Reports UI                         |
| **Hardening**                      | QA, A11y, perf, security              | Launch-ready build                              |

---

## 10. Non-Functional Requirements

* **Performance:** Edge-cached passages, lazy-loaded motion.
* **Accessibility:** WCAG AA tested.
* **Security:** Server-side validation, CSRF protection, rate limits.
* **Internationalization:** EN first; localization ready.
* **Observability:** Sentry, structured logs, Core Web Vitals.

---