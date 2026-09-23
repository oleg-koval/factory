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

Deployment is manual by owner choice. GitHub Actions validates changes but does not have
Cloudflare credentials or deploy the Worker. From a clean `main` checkout, after the source
commit is pushed and validation passes:

```bash
cd site
npm ci
npm run lint
npm test
npx wrangler deploy --dry-run --config wrangler.jsonc
npx wrangler deploy --config wrangler.jsonc
cd ..
node scripts/verify-live-seo.mjs
node scripts/verify-live-seo.mjs --alternate
```

Confirm the deploy output names `factory.olegkoval.com` and records a Worker version ID. Verify
the changed route on the live domain before calling the release delivered. The separate Sites
mirror is published through its own saved-version flow; a Worker deploy does not update it.
The `--alternate` check remains blocked until that mirror is separately updated and its live
HTML responses carry `noindex`.

For rollback, list Worker versions with `npx wrangler versions list` from `site/`, then use
`npx wrangler rollback <known-good-version-id>` and rerun the live verifier. Do not assume a
successful command alone proves the custom domain serves the intended version.

## Evidence boundary

The site reports proof exactly as recorded in the parent repository. Public-source installation,
Cloudflare deployment, DNS, TLS, browser acceptance, and project-local fresh Codex and Claude
Code consult invocations are verified. Global installation, a complete Factory run, search
indexation, adoption, and performance outcomes remain separate gates.
