import assert from "node:assert/strict";
import { test } from "node:test";
import { serializeJsonLd } from "../app/_components/serializeJsonLd.ts";

test("serializeJsonLd escapes markup characters and stays valid JSON", () => {
  const input = { a: "</script><b>&\u2028\u2029" };
  const out = serializeJsonLd(input);
  assert.ok(!/[<>&\u2028\u2029]/.test(out), "no raw <, >, &, U+2028 or U+2029");
  assert.ok(out.includes("\\u003c/script\\u003e"), "closing script tag is escaped");
  assert.deepEqual(JSON.parse(out), input);
});
