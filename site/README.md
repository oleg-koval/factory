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

## Evidence boundary

The site reports local proof exactly as recorded in the parent repository. Deployment, DNS,
public installation, and indexation are separate release gates.
