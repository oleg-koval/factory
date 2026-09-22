# Extractable components

## SiteHeader
- Source: `site/app/_components/SiteHeader.tsx`
- Category: layout
- Description: Sticky global navigation with wordmark, local-proof status, route links, and proof CTA.
- Extractable props: none; the route links and identity are shared constants.
- Hardcoded: Factory wordmark, navigation labels, URLs, CTA, CSS classes.

## SiteFooter
- Source: `site/app/_components/SiteFooter.tsx`
- Category: layout
- Description: Global product navigation and evidence/license metadata.
- Extractable props: none.
- Hardcoded: all labels, links, metadata, CSS classes.

## ProofExplorer
- Source: `site/app/_components/ProofExplorer.tsx`
- Category: basic
- Description: Accessible proof-state selector with terminal receipt and reasoning panel.
- Extractable props: active proof id only; proof data remains authoritative and hardcoded.
- Hardcoded: proof cases, terminal output, artifact links, CSS classes.

## StructuredData
- Source: `site/app/_components/StructuredData.tsx`
- Category: basic
- Description: JSON-LD script primitive.
- Extractable props: data object.
- Hardcoded: `application/ld+json` script type.
