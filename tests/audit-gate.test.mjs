import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, copyFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

function runAudit(output, exitCode = 0, exceptions = []) {
  const root = mkdtempSync(join(tmpdir(), 'factory-audit-'));
  try {
    mkdirSync(join(root, 'scripts'));
    mkdirSync(join(root, 'bin'));
    copyFileSync(new URL('../site/scripts/audit.mjs', import.meta.url), join(root, 'scripts/audit.mjs'));
    writeFileSync(join(root, 'audit-allowlist.json'), JSON.stringify(exceptions));
    writeFileSync(join(root, 'report'), output);
    writeFileSync(join(root, 'bin/npm'), '#!/bin/sh\ncat "$AUDIT_FIXTURE"\nexit "$AUDIT_EXIT"\n', { mode: 0o755 });
    return spawnSync(process.execPath, [join(root, 'scripts/audit.mjs')], {
      encoding: 'utf8', env: { ...process.env, PATH: `${root}/bin:${process.env.PATH}`,
        AUDIT_FIXTURE: join(root, 'report'), AUDIT_EXIT: String(exitCode) },
    });
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}
const clean = JSON.stringify({ auditReportVersion: 2, vulnerabilities: {} });
test('clean complete audit passes', () => assert.equal(runAudit(clean).status, 0));
test('malformed, network-error and failed audits cannot pass', () => {
  for (const output of ['broken', '{}', '{"error":{"code":"NETWORK"}}']) {
    assert.equal(runAudit(output).status, 1);
  }
  assert.equal(runAudit(clean, 2).status, 1);
  assert.equal(runAudit(clean, 1).status, 1);
  for (const via of [[], "broken", [null], [{ url: "missing fields" }]]) {
    const report = JSON.stringify({ auditReportVersion: 2, vulnerabilities: { dep: { via } } });
    assert.equal(runAudit(report, 1).status, 1);
  }
});
test('unlisted advisory fails and only an unexpired reviewed exception passes', () => {
  const url = 'https://example.test/advisory';
  const report = JSON.stringify({ auditReportVersion: 2, vulnerabilities: {
    dependency: { via: [{ url, severity: 'moderate', title: 'fixture' }] },
  } });
  assert.equal(runAudit(report, 1).status, 1);
  assert.equal(runAudit(report, 1, [{ url, review_by: '2000-01-01' }]).status, 1);
  assert.equal(runAudit(report, 1, [{ url, review_by: '2099-01-01' }]).status, 0);
});
