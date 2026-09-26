import assert from "node:assert/strict";
import test from "node:test";
import { parseSitemapUrls } from "../scripts/submit-indexnow.mjs";

const baseUrl = "https://factory.olegkoval.com";
const expected = ["/", "/proof/", "/install/"];

test("accepts the exact canonical sitemap route set", () => {
  const xml = ["/", "/proof/", "/install/"]
    .map((path) => `<url><loc>${baseUrl}${path}</loc></url>`)
    .join("");
  assert.deepEqual(parseSitemapUrls(`<urlset>${xml}</urlset>`, baseUrl, expected), expected.map((path) => baseUrl + path));
});

test("rejects duplicate sitemap URLs", () => {
  const xml = `<urlset><url><loc>${baseUrl}/</loc></url><url><loc>${baseUrl}/</loc></url></urlset>`;
  assert.throws(() => parseSitemapUrls(xml, baseUrl, expected), /duplicate URLs/);
});

test("rejects non-canonical or foreign URLs", () => {
  for (const value of ["https://other.example/proof/", `${baseUrl}/proof/?source=test`, `${baseUrl}/proof/#top`]) {
    assert.throws(
      () => parseSitemapUrls(`<urlset><url><loc>${value}</loc></url></urlset>`, baseUrl, ["/proof/"]),
      /non-canonical URL/,
    );
  }
});

test("rejects a sitemap whose URLs drift from the route specification", () => {
  const xml = `<urlset><url><loc>${baseUrl}/proof/</loc></url></urlset>`;
  assert.throws(() => parseSitemapUrls(xml, baseUrl, ["/install/"]), /differ from docs\/seo-routes/);
});
