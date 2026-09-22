# Page dependency trees

## `/`

Entry: `site/app/page.tsx`

- `site/app/page.tsx`
  - `site/app/_components/SiteHeader.tsx`
  - `site/app/_components/SiteFooter.tsx`
  - `site/app/_components/ProofExplorer.tsx`
  - `site/app/_components/StructuredData.tsx`
  - `site/app/layout.tsx`
    - `site/app/globals.css`

## `/proof/`

- `site/app/proof/page.tsx`
  - `site/public/proof/manifest.json`
  - `site/app/_components/ProofExplorer.tsx`
  - `site/app/_components/SiteHeader.tsx`
  - `site/app/_components/SiteFooter.tsx`
  - `site/app/_components/StructuredData.tsx`
  - `site/app/layout.tsx`
    - `site/app/globals.css`

## `/how-it-works/`, `/install/`, `/changelog/`, `/oleg-koval/`

Each page entry imports `SiteHeader`, `SiteFooter`, and the root layout/global stylesheet. Pages with public-entity metadata also import `StructuredData`.

## `/essays/right-to-say-not-delivered/`

- `site/app/essays/right-to-say-not-delivered/page.tsx`
  - `site/app/_components/SiteHeader.tsx`
  - `site/app/_components/SiteFooter.tsx`
  - `site/app/_components/StructuredData.tsx`
  - `site/app/layout.tsx`
    - `site/app/globals.css`
