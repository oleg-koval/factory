import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, realpath, rm } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { after, before, test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const baselineCommit = "7a774c4a1bce4e7d51649c328912fe6907443ed3";
const repoDir = fileURLToPath(new URL("../..", import.meta.url));
const route = "/case-studies/terminal-state-mismatch/";
const expectedH1 = "A blocked run passed the delivery gate.";
let fixtureDir;
let server;
let origin;

async function runChecked(command, args, cwd) {
  const child = spawn(command, args, { cwd, stdio: ["ignore", "pipe", "pipe"] });
  let output = "";
  for (const stream of [child.stdout, child.stderr]) {
    stream.setEncoding("utf8");
    stream.on("data", (chunk) => { output = (output + chunk).slice(-16_000); });
  }
  const code = await new Promise((done, reject) => {
    child.once("error", reject);
    child.once("close", done);
  });
  if (code !== 0) throw new Error(`${command} ${args.join(" ")} failed (${code})\n${output}`);
  return output;
}

async function extractBaseline() {
  fixtureDir = await mkdtemp(join(tmpdir(), "factory-hydration-baseline-"));
  const archive = spawn("git", ["archive", "--format=tar", baselineCommit, "site"], {
    cwd: repoDir, stdio: ["ignore", "pipe", "pipe"],
  });
  const unpack = spawn("tar", ["-x", "-C", fixtureDir], {
    stdio: ["pipe", "ignore", "pipe"],
  });
  archive.stdout.pipe(unpack.stdin);
  let errors = "";
  for (const stream of [archive.stderr, unpack.stderr]) {
    stream.setEncoding("utf8");
    stream.on("data", (chunk) => { errors += chunk; });
  }
  const wait = (child) => new Promise((done, reject) => {
    child.once("error", reject);
    child.once("close", done);
  });
  const [archiveCode, unpackCode] = await Promise.all([wait(archive), wait(unpack)]);
  if (archiveCode !== 0 || unpackCode !== 0) {
    throw new Error(`baseline archive extraction failed (git ${archiveCode}, tar ${unpackCode})\n${errors}`);
  }
  return join(fixtureDir, "site");
}

async function unusedPort() {
  const listener = createServer();
  await new Promise((ready, reject) => {
    listener.once("error", reject);
    listener.listen(0, "127.0.0.1", ready);
  });
  const port = listener.address().port;
  await new Promise((closed) => listener.close(closed));
  return port;
}

async function stopServer() {
  if (!server || server.exitCode !== null || server.signalCode !== null) return;
  try { process.kill(-server.pid, "SIGTERM"); } catch (error) {
    if (error.code !== "ESRCH") throw error;
  }
  const deadline = Date.now() + 3_000;
  while (server.exitCode === null && server.signalCode === null && Date.now() < deadline) {
    await delay(50);
  }
  if (server.exitCode === null && server.signalCode === null) {
    try { process.kill(-server.pid, "SIGKILL"); } catch (error) {
      if (error.code !== "ESRCH") throw error;
    }
  }
}

async function startServer(siteDir) {
  const port = await unusedPort();
  origin = `http://127.0.0.1:${port}`;
  server = spawn("npm", ["run", "dev", "--", "--hostname", "127.0.0.1", "--port", String(port)], {
    cwd: siteDir, detached: true, stdio: ["ignore", "pipe", "pipe"],
  });
  let output = "";
  for (const stream of [server.stdout, server.stderr]) {
    stream.setEncoding("utf8");
    stream.on("data", (chunk) => { output = (output + chunk).slice(-12_000); });
  }
  const deadline = Date.now() + 90_000;
  while (Date.now() < deadline) {
    if (server.exitCode !== null || server.signalCode !== null) {
      throw new Error(`baseline vinext dev exited early (${server.exitCode ?? server.signalCode})\n${output}`);
    }
    try {
      const response = await fetch(`${origin}${route}`, { signal: AbortSignal.timeout(2_000) });
      if (response.status === 200) return;
      if (response.status >= 400) throw new Error(`baseline vinext dev returned HTTP ${response.status}\n${output}`);
    } catch (error) {
      if (!/fetch failed|abort|timed out/i.test(String(error))) throw error;
    }
    await delay(250);
  }
  throw new Error(`baseline vinext dev did not serve ${route} within 90 seconds\n${output}`);
}

before(async () => {
  await runChecked("git", ["cat-file", "-e", `${baselineCommit}^{commit}`], repoDir);
  const siteDir = await extractBaseline();
  console.log(`AC-1 testing archived baseline ${baselineCommit}`);
  await runChecked("npm", ["ci", "--no-audit", "--no-fund"], siteDir);
  await startServer(siteDir);
}, { timeout: 300_000 });

after(async () => {
  await stopServer();
  if (fixtureDir) await rm(fixtureDir, { recursive: true, force: true });
});

for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
  test(`AC-1 ${viewport.width}x${viewport.height} baseline case study shows React JSON-LD versus Analytics hydration diff`, { timeout: 150_000 }, async () => {
    const { chromium } = process.env.PLAYWRIGHT_MODULE_PATH
      ? await import(pathToFileURL(resolve(process.env.PLAYWRIGHT_MODULE_PATH)).href)
      : await import("playwright");
    const executablePath = process.env.CHROMIUM_EXECUTABLE_PATH
      ? await realpath(process.env.CHROMIUM_EXECUTABLE_PATH)
      : undefined;
    const browser = await chromium.launch({ ...(executablePath && { executablePath }), headless: true });
    try {
      const context = await browser.newContext({ viewport });
      try {
        const page = await context.newPage();
        const diagnostics = [];
        page.on("console", (message) => {
          if (message.type() === "warning" || message.type() === "error") {
            diagnostics.push(`console.${message.type()}: ${message.text()}`);
          }
        });
        page.on("pageerror", (error) => diagnostics.push(`pageerror: ${error.stack ?? error.message}`));

        const response = await page.goto(`${origin}${route}`, { waitUntil: "domcontentloaded" });
        assert.equal(response?.status(), 200, `baseline case-study HTTP status: ${response?.status()}`);
        const heading = page.getByRole("heading", { level: 1, name: expectedH1 });
        await heading.waitFor({ state: "visible", timeout: 15_000 });
        assert.equal(await heading.isVisible(), true);
        try { await page.waitForLoadState("networkidle", { timeout: 15_000 }); } catch {
          // Analytics can keep the network busy while the app finishes hydration.
        }
        await page.waitForTimeout(3_000);

        const reactScriptComparison = diagnostics.find((message) =>
          /hydrated|hydration|server rendered HTML didn't match/i.test(message)
          && /application\/ld\+json/.test(message)
          && /TechArticle/.test(message)
          && /google-analytics/.test(message)
          && /dataLayer/.test(message),
        );
        assert.ok(reactScriptComparison, `AC-1 baseline ${baselineCommit}: expected React hydration diff comparing TechArticle JSON-LD with inline google-analytics/dataLayer after HTTP 200 and visible H1; captured diagnostics:\n${diagnostics.join("\n") || "(none)"}`);
      } finally {
        await context.close();
      }
    } finally {
      await browser.close();
    }
  });
}
