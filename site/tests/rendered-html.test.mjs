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
];

async function loadWorker() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  return (await import(workerUrl.href)).default;
}

async function render(path) {
  const builtWorker = await loadWorker();
  return builtWorker.fetch(
    new Request(`http://localhost${path}`, { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

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
