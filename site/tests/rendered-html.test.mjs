import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const routes = [
  ["/", "Factory — Delivery gates for AI coding agents", "Your agent can write code."],
  ["/proof/", "Factory Proof — Watch a false delivery claim fail", "A delivery claim should survive inspection."],
  ["/how-it-works/", "How Factory verifies AI-written software", "Seven gates between a request and an honest terminal state."],
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
  assert.match(html, /No public repository or public install is claimed yet/);
  assert.match(html, /href="\/proof\/manifest\.json"/);
});

test("unknown routes return the custom 404", async () => {
  const response = await render("/does-not-exist/");
  assert.equal(response.status, 404);
  assert.match(await response.text(), /This route did not earn “delivered.”/);
});
