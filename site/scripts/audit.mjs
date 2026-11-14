import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

const allowlistUrl = new URL("../audit-allowlist.json", import.meta.url);
const allowlist = JSON.parse(readFileSync(allowlistUrl, "utf8"));
const lock = JSON.parse(readFileSync(new URL("../package-lock.json", import.meta.url), "utf8"));
const text = value => typeof value === "string" && value.trim().length > 0;
const paths = value => Array.isArray(value) && value.length > 0 && value.every(text);
const isoDate = value => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
  && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;

if (!Array.isArray(allowlist) || allowlist.some(entry => !entry || !text(entry.url)
    || !text(entry.package) || !paths(entry.nodes) || !isoDate(entry.review_by)
    || entry.nodes.some(node => lock.packages?.[node]?.dev !== true))) {
  console.error("Invalid exception: require package, reviewed development paths, and a real ISO review date.");
  process.exit(1);
}

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

function resolveAdvisories(name, chain = []) {
  const vulnerability = Object.hasOwn(vulnerabilities, name) ? vulnerabilities[name] : null;
  if (chain.includes(name) || !vulnerability || !paths(vulnerability.nodes)
      || !Array.isArray(vulnerability.via) || vulnerability.via.length === 0) {
    throw new Error(`Invalid or cyclic vulnerability reference: ${[...chain, name].join(" -> ")}`);
  }
  return vulnerability.via.flatMap(via => {
    if (typeof via === "string") return resolveAdvisories(via, [...chain, name]);
    if (!via || !text(via.url) || !text(via.severity) || !text(via.title)) {
      throw new Error(`Invalid advisory evidence for ${name}`);
    }
    return [{ ...via, package: name, nodes: vulnerability.nodes }];
  });
}

function collectAdvisories() {
  try {
    const findings = Object.keys(vulnerabilities).flatMap(name => resolveAdvisories(name));
    return findings.filter((finding, index) => findings.findIndex(other =>
      other.package === finding.package && other.url === finding.url) === index);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
const advisories = collectAdvisories();

if (audit.status !== 0 && advisories.length === 0) {
  console.error("Dependency audit failed without advisory evidence.");
  process.exit(1);
}

const today = new Date().toISOString().slice(0, 10);
const describe = finding => `  [${finding.severity}] ${finding.package}: ${finding.title} ${finding.url} (${finding.nodes.join(", ")})`;
const unlisted = advisories.filter(finding => !allowlist.some(entry =>
  entry.url === finding.url && entry.package === finding.package
  && finding.nodes.every(node => entry.nodes.includes(node))));
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
console.log(advisories.map(describe).join("\n") || "  none");
