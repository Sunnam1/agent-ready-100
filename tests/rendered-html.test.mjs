import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

async function readJson(path) {
  return JSON.parse(await readFile(new URL(path, root), "utf8"));
}

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("the dataset is complete and structurally sound", async () => {
  const apps = await readJson("data/apps.json");
  assert.equal(apps.length, 100);
  assert.equal(new Set(apps.map((app) => app.id)).size, 100);

  const categoryCounts = new Map();
  for (const app of apps) {
    for (const field of ["name", "category", "does", "auth", "access", "surface", "breadth", "mcp", "verdict", "evidence", "confidence"]) {
      assert.ok(app[field], `${app.name || app.id} is missing ${field}`);
    }
    assert.ok(Array.isArray(app.evidence) && app.evidence.length > 0);
    categoryCounts.set(app.category, (categoryCounts.get(app.category) || 0) + 1);
  }

  assert.equal(categoryCounts.size, 10);
  assert.deepEqual([...categoryCounts.values()].sort((a, b) => a - b), Array(10).fill(10));
});

test("the manual verification sample records the accuracy lift", async () => {
  const verification = await readJson("data/verification.json");
  assert.equal(verification.checks.length, 20);
  assert.equal(verification.firstPassAccuracy, 83);
  assert.equal(verification.finalAccuracy, 96);
  assert.ok(verification.checks.some((check) => check.result === "Corrected"));
  assert.ok(verification.checks.some((check) => check.result === "Unresolved"));
});

test("the production worker renders the full case study", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>The Agent-Ready 100 \| Composio Product Ops Study<\/title>/i);
  assert.match(html, /The market is API-rich/i);
  assert.match(html, /all 20 manual checks/i);
  assert.match(html, /Source repository/i);
  assert.doesNotMatch(html, /Your site is taking shape|Building your site/i);
});
