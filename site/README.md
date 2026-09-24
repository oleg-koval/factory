# Factory site

The Cloudflare-compatible product and proof site for Factory.

## Local development

```bash
npm install
npm run dev
```

The development server runs at `http://localhost:3000/` by default.

## Verification

```bash
npm run lint
npm test
```

`npm test` builds the Worker, renders every canonical route, verifies metadata and visible H1s,
checks the custom 404, parses proof-page structured data, and asserts that the published proof
manifest matches the canonical repository manifest.

## Production deployment

GitHub Actions checks pull requests and pushes to `main` with `npm ci`, lint, and the complete
site build and rendered-route tests. It does not deploy or use Cloudflare deployment secrets.
Production deployment remains a separate, manual release decision.

For a manual deployment from a clean `main` checkout, run:

```bash
cd site
npm ci
npm run lint
npm test
npx wrangler deploy --dry-run --config wrangler.jsonc
npx wrangler deploy --config wrangler.jsonc
cd ..
node scripts/verify-live-seo.mjs
```

Confirm the deploy output names `factory.olegkoval.com` and records a Worker version ID. Verify
the changed route on the live domain before calling the release delivered. The separate Sites
mirror is published through its own saved-version flow; a Worker deploy does not update it.

For rollback, list Worker versions with `npx wrangler versions list` from `site/`, then use
`npx wrangler rollback <known-good-version-id>` and rerun the live verifier. Do not assume a
successful command alone proves the custom domain serves the intended version.

## Evidence boundary

The site reports proof exactly as recorded in the parent repository. Public-source installation,
Cloudflare deployment, DNS, TLS, browser acceptance, and project-local fresh Codex and Claude
Code consult invocations are verified. Global installation, a complete Factory run, search
indexation, adoption, and performance outcomes remain separate gates.
