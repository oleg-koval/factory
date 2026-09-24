import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { realpath } from "node:fs/promises";
import { createServer } from "node:net";
import { setTimeout as delay } from "node:timers/promises";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import { resolve } from "node:path";

const siteDir = fileURLToPath(new URL("..", import.meta.url));
const route = "/case-studies/terminal-state-mismatch/";
const expectedH1 = "A blocked run passed the delivery gate.";
const hydrationDiagnostic = /hydration|hydrated|server rendered HTML didn't match|server-rendered HTML did not match/i;
// AC-1 receipt: baseline 7a774c4 returned HTTP 200 with this H1 at 1440x900
// and 390x844; React compared TechArticle JSON-LD with inline google-analytics.
// AC-2 keeps both browser paths and requires that diagnostic to disappear.

async function unusedPort() {
  const listener = createServer();
  await new Promise((resolveReady, reject) => {
    listener.once("error", reject);
    listener.listen(0, "127.0.0.1", resolveReady);
  });
  const port = listener.address().port;
  await new Promise((resolveClosed) => listener.close(resolveClosed));
  return port;
}

async function startServer() {
  const port = await unusedPort();
  const origin = `http://127.0.0.1:${port}`;
  const mode = process.env.HYDRATION_SERVER_MODE === "production" ? "start" : "dev";
  const server = spawn("npm", ["run", mode, "--", "--hostname", "127.0.0.1", "--port", String(port)], {
    cwd: siteDir,
    detached: true,
    stdio: ["ignore", "pipe", "pipe"],
  });
  let output = "";
  for (const stream of [server.stdout, server.stderr]) {
    stream.setEncoding("utf8");
    stream.on("data", (chunk) => { output = (output + chunk).slice(-12_000); });
  }

  try {
    const deadline = Date.now() + 90_000;
    while (Date.now() < deadline) {
      if (server.exitCode !== null || server.signalCode !== null) {
        throw new Error(`vinext ${mode} exited early (${server.exitCode ?? server.signalCode})\n${output}`);
      }
      try {
        const response = await fetch(`${origin}${route}`, { signal: AbortSignal.timeout(2_000) });
        if (response.status === 200) return { server, origin };
        if (response.status >= 400) throw new Error(`vinext ${mode} returned HTTP ${response.status}\n${output}`);
      } catch (error) {
        if (!/fetch failed|abort|timed out/i.test(String(error))) throw error;
      }
      await delay(250);
    }
    throw new Error(`vinext ${mode} did not serve ${route} within 90 seconds\n${output}`);
  } catch (error) {
    await stopServer(server);
    throw error;
  }
}

async function stopServer(server) {
  if (server.exitCode !== null || server.signalCode !== null) return;
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

for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
test(`AC-1 baseline receipt / AC-2 ${viewport.width}x${viewport.height} case study has visible H1, no hydration warning, and Analytics page_view request`, { timeout: 150_000 }, async () => {
  const { chromium } = process.env.PLAYWRIGHT_MODULE_PATH
    ? await import(pathToFileURL(resolve(process.env.PLAYWRIGHT_MODULE_PATH)).href)
    : await import("playwright");
  const executablePath = process.env.CHROMIUM_EXECUTABLE_PATH
    ? await realpath(process.env.CHROMIUM_EXECUTABLE_PATH)
    : undefined;
  const { server, origin } = await startServer();
  let browser;
  try {
    browser = await chromium.launch({ ...(executablePath && { executablePath }), headless: true });
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    const diagnostics = [];
    const analyticsRequests = [];
    const analyticsFailures = [];
    page.on("request", (request) => {
      if (/google-analytics\.com|googletagmanager\.com/.test(new URL(request.url()).hostname)) {
        analyticsRequests.push(request.url());
      }
    });
    page.on("requestfailed", (request) => {
      if (/google-analytics\.com|googletagmanager\.com/.test(new URL(request.url()).hostname)) {
        analyticsFailures.push(`${request.url()}: ${request.failure()?.errorText}`);
      }
    });
    page.on("console", (message) => {
      if (message.type() === "warning" || message.type() === "error") {
        diagnostics.push(`console.${message.type()}: ${message.text()}`);
      }
    });
    page.on("pageerror", (error) => diagnostics.push(`pageerror: ${error.stack ?? error.message}`));

    const response = await page.goto(`${origin}${route}`, { waitUntil: "domcontentloaded" });
    assert.equal(response?.status(), 200, `case-study HTTP status: ${response?.status()}`);
    const initialHtml = await response.text();
    assert.match(initialHtml, /googletagmanager\.com\/gtag\/js\?id=G-0RRTME2WMJ/);
    assert.match(initialHtml, /gtag\('config', 'G-0RRTME2WMJ'\)/);
    const jsonLd = initialHtml.match(/<script type="application\/ld\+json">([^<]+)<\/script>/);
    assert.ok(jsonLd, "TechArticle JSON-LD must be present in the initial HTML");
    assert.equal(JSON.parse(jsonLd[1])["@type"], "TechArticle");
    const heading = page.getByRole("heading", { level: 1, name: expectedH1 });
    await heading.waitFor({ state: "visible", timeout: 15_000 });
    assert.equal(await heading.isVisible(), true);
    try {
      await page.waitForLoadState("networkidle", { timeout: 15_000 });
    } catch {
      // Analytics can keep the network busy; still allow the app's client scripts to settle.
    }
    await page.waitForTimeout(3_000);
    const analyticsConfig = await page.evaluate(() =>
      (globalThis.dataLayer ?? []).some((entry) => entry[0] === "config" && entry[1] === "G-0RRTME2WMJ"),
    );
    assert.equal(analyticsConfig, true, "Analytics config must reach dataLayer");
    const pageViewRequest = analyticsRequests.find((requestUrl) => {
      const url = new URL(requestUrl);
      return url.hostname.endsWith("google-analytics.com")
        && url.pathname.endsWith("/collect")
        && url.searchParams.get("en") === "page_view"
        && url.searchParams.get("tid") === "G-0RRTME2WMJ";
    });
    assert.ok(pageViewRequest, `Analytics page_view collection request must be attempted; requests: ${JSON.stringify(analyticsRequests)}; failures: ${JSON.stringify(analyticsFailures)}`);

    const hydrationMessages = diagnostics.filter((message) => hydrationDiagnostic.test(message));
    assert.deepEqual(hydrationMessages, [], `React hydration diagnostics after HTTP 200 and visible H1:\n${hydrationMessages.join("\n")}`);
    await context.close();
  } finally {
    await browser?.close();
    await stopServer(server);
  }
});
}
