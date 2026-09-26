#!/usr/bin/env node
// Notify IndexNow engines of the canonical routes declared by the live sitemap.
import { readFileSync } from "node:fs";
import { basename, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const spec = JSON.parse(readFileSync(new URL("../docs/seo-routes.json", import.meta.url), "utf8"));
const keyFile = new URL("../site/public/e8d6bdc3149e063961b7bd0cb967e962.txt", import.meta.url);

export function parseSitemapUrls(xml, baseUrl, expectedPaths) {
  const actual = [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g)].map((match) =>
    match[1].replaceAll("&amp;", "&"),
  );
  const expected = expectedPaths.map((path) => new URL(path, baseUrl).href);

  if (!actual.length) throw new Error("the sitemap contains no <loc> URLs");
  if (new Set(actual).size !== actual.length) throw new Error("the sitemap contains duplicate URLs");

  for (const value of actual) {
    const url = new URL(value);
    if (url.origin !== baseUrl || url.search || url.hash || url.username || url.password) {
      throw new Error(`non-canonical URL in sitemap: ${value}`);
    }
  }

  if (actual.length !== expected.length || [...actual].sort().join("\n") !== [...expected].sort().join("\n")) {
    throw new Error("live sitemap URLs differ from docs/seo-routes.json");
  }

  return actual;
}

async function get(url, label) {
  const response = await fetch(url, { redirect: "error", signal: AbortSignal.timeout(15000) });
  const body = await response.text();
  if (!response.ok) throw new Error(`${label}: HTTP ${response.status}: ${body.slice(0, 300)}`);
  return body;
}

async function main() {
  const baseUrl = spec.base_url;
  const key = readFileSync(keyFile, "utf8").trim();
  const keyPath = "/" + basename(fileURLToPath(keyFile));
  if (!/^[a-f0-9]{8,128}$/i.test(key)) throw new Error("local IndexNow key is not valid hexadecimal");

  const publishedKey = (await get(new URL(keyPath, baseUrl), "public key file")).trim();
  if (publishedKey !== key) throw new Error("the deployed public key file does not match the repository");

  const sitemap = await get(new URL("/sitemap.xml", baseUrl), "live sitemap");
  const urlList = parseSitemapUrls(sitemap, baseUrl, spec.routes.map((route) => route.path));
  if (process.argv.includes("--dry-run")) {
    console.log(`INDEXNOW: DRY RUN host=${new URL(baseUrl).host} urls=${urlList.length}; public key and sitemap verified`);
    return;
  }

  const response = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify({ host: new URL(baseUrl).host, key, urlList }),
    redirect: "error",
    signal: AbortSignal.timeout(20000),
  });
  const body = await response.text();
  if (response.status !== 200 && response.status !== 202) {
    throw new Error(`IndexNow submission failed: HTTP ${response.status}: ${body.slice(0, 300)}`);
  }
  const state = response.status === 200 ? "received" : "accepted; key verification pending";
  console.log(`INDEXNOW: ${state} host=${new URL(baseUrl).host} urls=${urlList.length}`);
  console.log("This confirms receipt only; it does not prove crawling, indexing, or ranking.");
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error("INDEXNOW: BLOCKED");
    console.error("  " + String(error));
    process.exitCode = 1;
  });
}
