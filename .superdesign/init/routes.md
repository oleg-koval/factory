# Routes

Framework: React 19 through vinext App Router, built by Vite for Cloudflare Workers.

| URL | Entry file | Shared layout | Summary |
|---|---|---|---|
| `/` | `site/app/page.tsx` | Root + SiteHeader + SiteFooter | Product claim, proof explorer, seven gates, failures, comparison, terminal states, essay, install, author |
| `/proof/` | `site/app/proof/page.tsx` | Root + SiteHeader + SiteFooter | Proof cases, public manifest, terminal mismatch case study |
| `/how-it-works/` | `site/app/how-it-works/page.tsx` | Root + SiteHeader + SiteFooter | Seven delivery gates and host contract |
| `/install/` | `site/app/install/page.tsx` | Root + SiteHeader + SiteFooter | Staged commands and verified local boundary |
| `/changelog/` | `site/app/changelog/page.tsx` | Root + SiteHeader + SiteFooter | Failures behind each unreleased rule |
| `/oleg-koval/` | `site/app/oleg-koval/page.tsx` | Root + SiteHeader + SiteFooter | Evidence-bounded author profile |
| `/essays/right-to-say-not-delivered/` | `site/app/essays/right-to-say-not-delivered/page.tsx` | Root + SiteHeader + SiteFooter | Long-form category essay |

Metadata routes: `site/app/robots.ts`, `site/app/sitemap.ts`. Error route: `site/app/not-found.tsx`.
