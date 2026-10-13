import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

const allowlistUrl = new URL("../audit-allowlist.json", import.meta.url);
const allowlist = JSON.parse(readFileSync(allowlistUrl, "utf8"));
const allowedUrls = new Set(allowlist.map((entry) => entry.url));

const audit = spawnSync("npm", ["audit", "--json", "--audit-level=moderate"], {
  encoding: "utf8",
  maxBuffer: 64 * 1024 * 1024,
});
const { vulnerabilities = {} } = JSON.parse(audit.stdout);

const advisories = new Map();
for (const vulnerability of Object.values(vulnerabilities)) {
  for (const via of vulnerability.via) {
    if (typeof via === "object") advisories.set(via.url, via);
  }
}

const today = new Date().toISOString().slice(0, 10);
const describe = ({ severity, title, url }) => `  [${severity}] ${title} ${url}`;
const unlisted = [...advisories.values()].filter(({ url }) => !allowedUrls.has(url));
const expired = allowlist.filter((entry) => entry.review_by < today);

if (unlisted.length > 0) {
  console.error("Advisories not in audit-allowlist.json:");
  console.error(unlisted.map(describe).join("\n"));
}
if (expired.length > 0) {
  console.error("Allowlist entries past review_by:");
  console.error(expired.map((e) => `  ${e.url} (review_by ${e.review_by})`).join("\n"));
}
if (unlisted.length > 0 || expired.length > 0) process.exit(1);

console.log("Allowed advisories:");
console.log([...advisories.values()].map(describe).join("\n") || "  none");
