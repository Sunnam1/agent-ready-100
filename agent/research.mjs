import { readFile, mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const apps = JSON.parse(await readFile(resolve(root, "data/apps.json"), "utf8"));
const outDir = resolve(root, "work");
await mkdir(outDir, { recursive: true });

const args = new Set(process.argv.slice(2));
const shouldFetch = !args.has("--no-fetch");
const timeoutMs = 15_000;

const auditUrl = async (url) => {
  let lastFailure;
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, {
        redirect: "follow",
        signal: controller.signal,
        headers: {
          "user-agent": "Mozilla/5.0 (compatible; AgentReady100/1.0; research verification)",
          accept: "text/html,application/json;q=0.9,*/*;q=0.8",
        },
      });
      await response.body?.cancel();
      const status = response.status;
      const result = {
        url,
        finalUrl: response.url,
        status,
        attempts: attempt,
        state: status >= 200 && status < 400 ? "reachable" : [401, 403, 429].includes(status) ? "guarded" : "failed",
      };
      if (result.state !== "failed" || status < 500) return result;
      lastFailure = result;
    } catch (error) {
      lastFailure = {
        url,
        status: null,
        attempts: attempt,
        state: "failed",
        error: error.name === "AbortError" ? "timeout" : error.message,
      };
    } finally {
      clearTimeout(timer);
    }
  }
  return lastFailure;
};

const runPool = async (items, worker, concurrency = 8) => {
  const output = new Array(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: concurrency }, async () => {
    while (next < items.length) {
      const index = next++;
      output[index] = await worker(items[index]);
    }
  }));
  return output;
};

const contradictions = apps.flatMap((app) => {
  const warnings = [];
  if (!app.evidence?.length) warnings.push("missing evidence");
  if (app.verdict === "Ready" && app.access === "Gated") warnings.push("ready despite gated access");
  if (app.verdict === "Ready" && /Undocumented/i.test(app.auth)) warnings.push("ready with undocumented auth");
  if (app.mcp === "Official" && app.evidence.length < 2 && !app.evidence.some((url) => /mcp|clay-api-cli/i.test(url))) {
    warnings.push("official MCP needs a dedicated source");
  }
  if (app.confidence === "Low") warnings.push("human review required");
  return warnings.map((warning) => ({ id: app.id, app: app.name, warning }));
});

const urls = [...new Set(apps.flatMap((app) => app.evidence))];
const urlResults = shouldFetch ? await runPool(urls, auditUrl) : [];
const byUrl = new Map(urlResults.map((item) => [item.url, item]));
const appAudit = apps.map((app) => {
  const sources = app.evidence.map((url) => byUrl.get(url)).filter(Boolean);
  return {
    id: app.id,
    app: app.name,
    confidence: app.confidence,
    sources,
    sourceState: !shouldFetch ? "not-run" : sources.some((s) => s.state === "reachable") ? "verified-online" : sources.some((s) => s.state === "guarded") ? "guarded" : "needs-review",
  };
});

const counts = (key) => Object.fromEntries(
  [...new Set(apps.map((app) => app[key]))].sort().map((value) => [value, apps.filter((app) => app[key] === value).length])
);

const report = {
  generatedAt: new Date().toISOString(),
  pipeline: [
    "Seed the 100-app task set and official developer entry points.",
    "Normalize auth, credential access, API breadth, MCP status, and buildability.",
    "Run contradiction checks so API exists is never treated as credentials are obtainable.",
    "Fetch every evidence URL and separate reachable, guarded, and failed sources.",
    "Queue low-confidence or contradictory rows for a human/browser check.",
  ],
  summary: {
    apps: apps.length,
    evidenceUrls: urls.length,
    access: counts("access"),
    verdict: counts("verdict"),
    mcp: counts("mcp"),
    confidence: counts("confidence"),
    sourceStates: shouldFetch ? {
      reachable: urlResults.filter((x) => x.state === "reachable").length,
      guarded: urlResults.filter((x) => x.state === "guarded").length,
      failed: urlResults.filter((x) => x.state === "failed").length,
    } : null,
    contradictionWarnings: contradictions.length,
  },
  contradictions,
  apps: appAudit,
};

await writeFile(resolve(outDir, "research-report.json"), JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify(report.summary, null, 2));
console.log("Wrote " + resolve(outDir, "research-report.json"));
