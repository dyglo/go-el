# GO'EL PWA Readiness Notes

## Manifest & Icons
- Manifest served from `/manifest.webmanifest`.
- Icons located under `public/icons` with maskable variant for install prompts.
- Shortcuts provide fast access to `/feed` and `/plans`.

## Offline Behaviour
- Recently viewed passages (latest 50) cached in `localStorage` for offline reading.
- Dedicated `/offline` route presents a friendly fallback when the network drops.
- Plans and Verse of the Day gracefully degrade by reusing cached Scripture text if the API is unavailable.

## Lighthouse Audit Checklist
- Run `npx @lhci/cli collect --url=http://localhost:3000 --collect.staticDistDir=.next` after building.
- Expect PWA category to pass Installability and Offline Capable once service worker caching is configured.
- Target scores: Performance ≥ 85, Accessibility ≥ 95, Best Practices ≥ 95, SEO ≥ 95.

## Next Steps
1. Wire a service worker (Workbox or Next PWA plugin) to precache `/offline`, `/feed`, `/plans`, and the manifolds plus icon assets.
2. Persist reading plan progress to the database once authentication is fully wired.
3. Add background sync for share workflow drafts when offline.
4. Document reminder notification scheduling once backend jobs are available.
