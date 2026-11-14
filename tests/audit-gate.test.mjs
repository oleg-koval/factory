import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, copyFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const nodePath = 'node_modules/dependency';
const url = 'https://example.test/advisory';
const advisory = { url, severity: 'moderate', title: 'fixture' };
const exception = { url, package: 'dependency', nodes: [nodePath], review_by: '2099-01-01' };
const reportFor = vulnerabilities => JSON.stringify({ auditReportVersion: 2, vulnerabilities });
const dependency = { nodes: [nodePath], via: [advisory] };

function runAudit(output, exitCode = 0, exceptions = [], packages = { [nodePath]: { dev: true } }) {
  const root = mkdtempSync(join(tmpdir(), 'factory-audit-'));
  try {
    mkdirSync(join(root, 'scripts'));
    mkdirSync(join(root, 'bin'));
    copyFileSync(new URL('../site/scripts/audit.mjs', import.meta.url), join(root, 'scripts/audit.mjs'));
    writeFileSync(join(root, 'audit-allowlist.json'), JSON.stringify(exceptions));
    writeFileSync(join(root, 'package-lock.json'), JSON.stringify({ packages }));
    writeFileSync(join(root, 'report'), output);
    writeFileSync(join(root, 'bin/npm'), '#!/bin/sh\n'
      + '[ "$#" -eq 3 ] && [ "$1" = audit ] && [ "$2" = --json ] && [ "$3" = --audit-level=moderate ] || exit 2\n'
      + 'cat "$AUDIT_FIXTURE"\nexit "$AUDIT_EXIT"\n', { mode: 0o755 });
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
    const report = reportFor({ dep: { nodes: [nodePath], via } });
    assert.equal(runAudit(report, 1).status, 1);
  }
});
test('unlisted advisory fails and only an unexpired reviewed exception passes', () => {
  const report = reportFor({ dependency });
  assert.equal(runAudit(report, 1).status, 1);
  assert.equal(runAudit(report, 1, [{ ...exception, review_by: '2000-01-01' }]).status, 1);
  assert.equal(runAudit(report, 1, [exception]).status, 0);
});

test('exceptions cover only the reviewed package and development lockfile paths', () => {
  assert.equal(runAudit(reportFor({ other: dependency }), 1, [exception]).status, 1);
  assert.equal(runAudit(reportFor({ dependency: { ...dependency,
    nodes: [nodePath, 'node_modules/unreviewed'] } }), 1, [exception]).status, 1);
  assert.equal(runAudit(reportFor({ dependency }), 1, [exception], { [nodePath]: { dev: false } }).status, 1);
  assert.equal(runAudit(reportFor({ dependency }), 1, [exception], {}).status, 1);
});

test('string references resolve to reviewed evidence and reject missing or cyclic references', () => {
  const wrapper = { nodes: ['node_modules/wrapper'], via: ['dependency'] };
  assert.equal(runAudit(reportFor({ wrapper, dependency }), 1, [exception]).status, 0);
  assert.equal(runAudit(reportFor({ wrapper }), 0, [exception]).status, 1);
  assert.equal(runAudit(reportFor({ wrapper, dependency: { ...dependency, via: ['wrapper'] } }),
    0, [exception]).status, 1);
  assert.equal(runAudit(reportFor({ dependency: { ...dependency, via: [advisory, 'missing'] } }),
    0, [exception]).status, 1);
});

test('review dates must be real ISO calendar dates strictly after today', () => {
  for (const review_by of [undefined, null, 'later', '2099-1-01', '2099-02-29', '2099-13-01',
    new Date().toISOString().slice(0, 10)]) {
    assert.equal(runAudit(reportFor({ dependency }), 1, [{ ...exception, review_by }]).status, 1);
  }
  assert.equal(runAudit(reportFor({ dependency }), 1,
    [{ ...exception, review_by: '2096-02-29' }]).status, 0);
});
