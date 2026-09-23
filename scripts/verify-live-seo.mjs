#!/usr/bin/env node
// Compare the published site's crawl surface with docs/seo-routes.json.
import { readFileSync } from "node:fs";

const spec = JSON.parse(readFileSync(new URL("../docs/seo-routes.json", import.meta.url), "utf8"));
const origin = process.argv[2] ?? spec.base_url;
const failures = [];

if (process.argv.length > 3 || !/^(https:\/\/[^/]+|http:\/\/localhost(?::\d+)?)$/.test(origin)) {
  console.error("usage: node scripts/verify-live-seo.mjs [https://site-origin|http://localhost:port]");
  process.exit(2);
}

function decodeHtml(value) {
  return value
    ?.replaceAll("&quot;", '"')
    .replaceAll("&#x27;", "'")
    .replaceAll("&#39;", "'")
    .replaceAll("&amp;", "&");
}

function match(html, pattern) {
  return decodeHtml(html.match(pattern)?.[1]);
}

function schemaTypes(value, found = new Set()) {
  if (Array.isArray(value)) {
    for (const item of value) schemaTypes(item, found);
  } else if (value && typeof value === "object") {
    if (typeof value["@type"] === "string") found.add(value["@type"]);
    for (const child of Object.values(value)) schemaTypes(child, found);
  }
  return found;
}

async function get(path) {
  const url = new URL(path, origin);
  try {
    const response = await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(15000) });
    return { response, body: await response.text() };
  } catch (error) {
    failures.push(path + " unavailable: " + String(error));
    return null;
  }
}

for (const route of spec.routes) {
  const result = await get(route.path);
  if (!result) continue;
  const { response, body } = result;
  const prefix = route.path + ": ";
  if (response.status !== 200) failures.push(prefix + "HTTP " + response.status + ", expected 200");
  if (!response.headers.get("content-type")?.includes("text/html")) failures.push(prefix + "not HTML");
  if (match(body, /<title>([^<]*)<\/title>/) !== route.title) failures.push(prefix + "title differs from spec");
  if (match(body, /<meta name="description" content="([^"]*)"/) !== route.description) failures.push(prefix + "description differs from spec");
  if (match(body, /<link rel="canonical" href="([^"]*)"/) !== spec.base_url + route.path) failures.push(prefix + "canonical differs from spec");
  if ([...body.matchAll(/<h1(?:\s[^>]*)?>/g)].length !== 1) failures.push(prefix + "expected one H1");
  if (/name="robots" content="[^"]*noindex/i.test(body) || /noindex/i.test(response.headers.get("x-robots-tag") ?? "")) failures.push(prefix + "unexpected noindex");

  const types = new Set();
  for (const [, source] of body.matchAll(/<script type="application\/ld\+json">([^<]*)<\/script>/g)) {
    try {
      schemaTypes(JSON.parse(source), types);
    } catch {
      failures.push(prefix + "invalid JSON-LD");
    }
  }
  for (const expected of route.schemas) {
    if (!types.has(expected)) failures.push(prefix + "missing " + expected + " schema");
  }
}

const robots = await get("/robots.txt");
if (robots && (robots.response.status !== 200 || !robots.body.includes("Sitemap: " + spec.base_url + "/sitemap.xml"))) {
  failures.push("/robots.txt: canonical sitemap missing");
}

const sitemap = await get("/sitemap.xml");
if (sitemap) {
  if (sitemap.response.status !== 200) failures.push("/sitemap.xml: HTTP " + sitemap.response.status);
  const actual = [...sitemap.body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((entry) => entry[1]);
  const expected = spec.routes.map((route) => spec.base_url + route.path);
  if (actual.length !== new Set(actual).size || actual.sort().join("\n") !== expected.sort().join("\n")) {
    failures.push("/sitemap.xml: URLs differ from the route spec");
  }
}

if (failures.length) {
  console.log("LIVE SEO: BLOCKED");
  for (const failure of failures) console.log("  " + failure);
  process.exit(1);
}

console.log("LIVE SEO: PASS routes=" + spec.routes.length + " origin=" + origin);
