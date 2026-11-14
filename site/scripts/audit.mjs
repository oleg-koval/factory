import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

const allowlistUrl = new URL("../audit-allowlist.json", import.meta.url);
const allowlist = JSON.parse(readFileSync(allowlistUrl, "utf8"));
const allowedUrls = new Set(allowlist.map((entry) => entry.url));

// Only reviewed advisory-specific exceptions may pass the full dependency audit.
const audit = spawnSync("npm", ["audit", "--json", "--audit-level=moderate"], {
  encoding: "utf8",
  maxBuffer: 64 * 1024 * 1024,
});
if (audit.error || ![0, 1].includes(audit.status)) {
  console.error("Dependency audit failed to run successfully.");
  process.exit(1);
}
let report;
try {
  report = JSON.parse(audit.stdout);
} catch {
  console.error("Dependency audit returned malformed JSON.");
  process.exit(1);
}
if (!report || report.error || !report.vulnerabilities || typeof report.vulnerabilities !== "object"
    || Array.isArray(report.vulnerabilities) || report.auditReportVersion !== 2) {
  console.error("Dependency audit returned an invalid report.");
  process.exit(1);
}
const { vulnerabilities } = report;

const advisories = new Map();
for (const vulnerability of Object.values(vulnerabilities)) {
  if (!vulnerability || !Array.isArray(vulnerability.via) || vulnerability.via.length === 0
      || vulnerability.via.some(via => typeof via !== "string" && (!via || typeof via !== "object"
        || typeof via.url !== "string" || typeof via.severity !== "string" || typeof via.title !== "string"))) {
    console.error("Dependency audit returned invalid vulnerability evidence.");
    process.exit(1);
  }
  for (const via of vulnerability.via) {
    if (typeof via === "object") advisories.set(via.url, via);
  }
}

if (audit.status !== 0 && advisories.size === 0) {
  console.error("Dependency audit failed without advisory evidence.");
  process.exit(1);
}

const today = new Date().toISOString().slice(0, 10);
const describe = ({ severity, title, url }) => `  [${severity}] ${title} ${url}`;
const unlisted = [...advisories.values()].filter(({ url }) => !allowedUrls.has(url));
const expired = allowlist.filter((entry) => entry.review_by <= today);

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
