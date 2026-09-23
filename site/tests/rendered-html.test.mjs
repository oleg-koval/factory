import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const routes = [
  ["/", "Factory — Delivery gates for AI coding agents", "Your agent can write code."],
  ["/proof/", "Factory Proof — Watch a false delivery claim fail", "A delivery claim should survive inspection."],
  ["/how-it-works/", "Factory run map — A verified AI coding agent workflow", "The complete run—from ticket to verified draft PR."],
  ["/install/", "Install Factory for Claude Code and Codex", "Bring your own agent. Keep the gates."],
  ["/changelog/", "Factory changelog — Every rule begins with a failure", "Every rule begins with a failure."],
  ["/oleg-koval/", "Oleg Koval — Reliable agent-driven software delivery", "I build systems that have to show their work."],
  ["/essays/right-to-say-not-delivered/", "Your software factory needs the right to say not delivered", "Your software factory needs the right to say “not delivered.”"],
  ["/case-studies/terminal-state-mismatch/", "Factory case study — When a blocked run passed delivery", "A blocked run passed the delivery gate."],
];

async function loadWorker() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  return (await import(workerUrl.href)).default;
}

async function render(path, host = "localhost") {
  const builtWorker = await loadWorker();
  return builtWorker.fetch(
    new Request(`http://${host}${path}`, { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("alternate-host HTML is noindex while the canonical host stays indexable", async () => {
  for (const [path] of routes) {
    const [mirror, canonical] = await Promise.all([
      render(path, "factory.olkokoval.chatgpt.site"),
      render(path, "factory.olegkoval.com"),
    ]);

    assert.equal(mirror.status, 200, `mirror ${path}`);
    assert.match(mirror.headers.get("x-robots-tag") ?? "", /\bnoindex\b/i, `mirror ${path}`);
    assert.equal(canonical.status, 200, `canonical ${path}`);
    assert.equal(canonical.headers.get("x-robots-tag"), null, `canonical ${path}`);
  }
});

for (const [path, title, h1] of routes) {
  test(`${path} renders unique metadata and meaningful HTML`, async () => {
    const response = await render(path);
    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
    const html = await response.text();
    assert.ok(html.includes(`<title>${title}</title>`), `missing title for ${path}`);
    assert.ok(html.includes(h1), `missing H1 text for ${path}`);
    assert.match(html, /<meta name="description" content="[^"]+"/);
    assert.match(html, /<link rel="canonical" href="https:\/\/factory\.olegkoval\.com\//);
    assert.doesNotMatch(html, /codex-preview|react-loading-skeleton|Starter Project/);
  });
}

test("Google Analytics tag is present in the initial HTML", async () => {
  const response = await render("/");
  const html = await response.text();

  assert.ok(
    html.includes("https://www.googletagmanager.com/gtag/js?id=G-0RRTME2WMJ"),
    "Google Analytics library must be discoverable before client hydration",
  );
  assert.ok(
    html.includes("gtag('config', 'G-0RRTME2WMJ')"),
    "Google Analytics must configure the expected measurement ID",
  );
});

test("proof manifest is synchronized with the repository manifest", async () => {
  const [published, canonical] = await Promise.all([
    readFile(new URL("../public/proof/manifest.json", import.meta.url), "utf8"),
    readFile(new URL("../../proof/manifest.json", import.meta.url), "utf8"),
  ]);
  assert.deepEqual(JSON.parse(published), JSON.parse(canonical));
});

test("proof page contains parseable structured data and visible boundaries", async () => {
  const response = await render("/proof/");
  const html = await response.text();
  const jsonLd = html.match(/<script type="application\/ld\+json">([^<]+)<\/script>/);
  assert.ok(jsonLd);
  assert.equal(JSON.parse(jsonLd[1])["@type"], "CollectionPage");
  assert.match(html, /Public-source installation was verified in a disposable repository/);
  assert.match(html, /href="\/proof\/manifest\.json"/);
  assert.match(html, /href="https:\/\/github\.com\/oleg-koval\/factory\/blob\/main\/proof\/terminal-gate\/false-delivery\/state\.json"/);
});

test("install and changelog publish structured data matching visible content", async () => {
  const [install, changelog] = await Promise.all([
    render("/install/").then((response) => response.text()),
    render("/changelog/").then((response) => response.text()),
  ]);
  const jsonLd = /<script type="application\/ld\+json">([^<]+)<\/script>/;
  const installData = JSON.parse(install.match(jsonLd)?.[1] ?? "null");
  const changelogData = JSON.parse(changelog.match(jsonLd)?.[1] ?? "null");
  assert.deepEqual(installData["@graph"].map((entry) => entry["@type"]), ["WebPage", "SoftwareSourceCode"]);
  assert.match(install, /npx skills add oleg-koval\/factory/);
  assert.equal(changelogData["@type"], "CollectionPage");
  assert.equal(changelogData.mainEntity.itemListElement.length, 7);
  assert.match(changelog, /Eight-route discovery contract/);
});

test("gate failure case study exposes exact receipts, source links, and evidence limits", async () => {
  const response = await render("/case-studies/terminal-state-mismatch/");
  const html = await response.text();
  const jsonLd = html.match(/<script type="application\/ld\+json">([^<]+)<\/script>/);
  assert.ok(jsonLd);
  assert.equal(JSON.parse(jsonLd[1])["@type"], "TechArticle");
  assert.match(html, /<meta property="og:title" content="Factory case study — When a blocked run passed delivery"/);
  assert.match(html, /<meta property="og:description" content="A real Factory gate defect:/);
  assert.match(html, /<meta name="twitter:title" content="Factory case study — When a blocked run passed delivery"/);
  assert.match(html, /<meta name="twitter:description" content="A real Factory gate defect:/);
  assert.doesNotMatch(html, /<meta (?:property="og:image"|name="twitter:image")/);
  assert.match(html, /GATE: PASS {2}run=mismatched-terminal terminal=delivered matrix=clean/);
  assert.match(html, /state\.terminal &#x27;blocked&#x27; does not match requested terminal &#x27;delivered&#x27;/);
  assert.match(html, /not<\/strong> a complete Phase 0–6 Factory-orchestrated run/);
  assert.match(html, /regression-test\.patch/);
  assert.match(html, /e0f8277804949502fda1134e75e4e6056c8478ae/);
  assert.match(html, /fd1cd03381451bc610e7424123132cb2f6a12aba/);
});

test("displayed gate results match the published executable receipt", async () => {
  const [resultsText, receipt] = await Promise.all([
    readFile(new URL("../public/proof/gate-results.json", import.meta.url), "utf8"),
    readFile(new URL("../public/proof/terminal-gate.txt", import.meta.url), "utf8"),
  ]);
  const results = JSON.parse(resultsText);
  assert.equal(Object.keys(results).length, 3);

  for (const [caseId, output] of Object.entries(results)) {
    assert.ok(receipt.includes(output), `${caseId} does not match the published gate receipt`);
  }
});

test("built proof receipt matches the committed public asset", async () => {
  const [source, built] = await Promise.all([
    readFile(new URL("../public/proof/terminal-gate.txt", import.meta.url)),
    readFile(new URL("../dist/client/proof/terminal-gate.txt", import.meta.url)),
  ]);
  assert.deepEqual(built, source);
});

test("run map exposes the complete phase contract and both PDF editions", async () => {
  const response = await render("/how-it-works/");
  const html = await response.text();

  for (const phase of ["Intake", "Isolate", "Diagnosis", "Human plan", "Grill", "Agent plan", "Milestones", "Proof", "Stop"]) {
    assert.ok(html.includes(phase), `missing ${phase} phase`);
  }
  assert.match(html, /Only <code>state\.json<\/code> crosses sessions/);
  assert.match(html, /href="\/downloads\/factory-run-flow-onepage\.pdf"/);
  assert.match(html, /href="\/downloads\/factory-run-flow-a4\.pdf"/);
});

test("run-map downloads are published as non-empty PDF files", async () => {
  for (const file of ["factory-run-flow-onepage.pdf", "factory-run-flow-a4.pdf"]) {
    const pdf = await readFile(new URL(`../public/downloads/${file}`, import.meta.url));
    assert.equal(pdf.subarray(0, 5).toString(), "%PDF-");
    assert.ok(pdf.byteLength > 10_000, `${file} is unexpectedly small`);
  }
});

test("install page states verified counts and invocation limits", async () => {
  const response = await render("/install/");
  const html = await response.text();
  assert.match(html, /The eight-route search specification passed locally/);
  assert.doesNotMatch(html, /seven-route search specification/);
  assert.match(html, /A fresh Codex session discovered/);
  assert.match(html, /A fresh Claude Code session used/);
  assert.match(html, /Global installation and a complete run remain release gates/);
  assert.match(html, /docs\/install-verification\.md/);
});

test("wide proof receipts and comparison tables are keyboard-accessible", async () => {
  const [home, proof, caseStudy] = await Promise.all([
    render("/").then((response) => response.text()),
    render("/proof/").then((response) => response.text()),
    render("/case-studies/terminal-state-mismatch/").then((response) => response.text()),
  ]);
  assert.match(home, /class="table-wrap" role="region" aria-label="Factory comparison table" tabindex="0"/);
  assert.match(proof, /role="region" aria-label="Factory gate output" tabindex="0"/);
  assert.match(caseStudy, /role="region" aria-label="Baseline false-pass receipt" tabindex="0"/);
});

test("unknown routes return the custom 404", async () => {
  const response = await render("/does-not-exist/");
  assert.equal(response.status, 404);
  assert.match(await response.text(), /This route did not earn “delivered.”/);
});

test("Cloudflare serves built assets before falling back to the SSR worker", async () => {
  const config = JSON.parse(
    await readFile(new URL("../wrangler.jsonc", import.meta.url), "utf8"),
  );

  assert.notEqual(config.assets?.run_worker_first, true);
});
