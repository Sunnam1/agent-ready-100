import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

async function collectSourceFiles(directory, prefix = "") {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if ([".git", ".next", "dist", "node_modules", "work"].includes(entry.name)) continue;
    const relative = `${prefix}${entry.name}`;
    if (entry.isDirectory()) files.push(...await collectSourceFiles(new URL(`${entry.name}/`, directory), `${relative}/`));
    else files.push(relative);
  }
  return files;
}

test("the frontend is static HTML, CSS, and JavaScript", async () => {
  const files = await collectSourceFiles(root);
  assert.ok(files.includes("index.html"));
  assert.ok(files.includes("styles.css"));
  assert.ok(files.includes("app.js"));
  assert.ok(files.includes("build-static.mjs"));
  assert.deepEqual(files.filter((file) => /\.tsx?$/.test(file)), []);

  const [html, script] = await Promise.all([read("index.html"), read("app.js")]);
  assert.match(html, /<script type="module" src="\.\/app\.js"><\/script>/);
  assert.match(html, /id="app-rows"/);
  assert.match(script, /fetchJson\("\.\/data\/apps\.json"\)/);
  assert.match(script, /renderTable/);
});

test("the research and verification datasets are complete", async () => {
  const apps = JSON.parse(await read("data/apps.json"));
  const verification = JSON.parse(await read("data/verification.json"));
  assert.equal(apps.length, 100);
  assert.equal(new Set(apps.map((app) => app.id)).size, 100);
  assert.equal(new Set(apps.map((app) => app.category)).size, 10);
  assert.equal(verification.checks.length, 20);
  assert.equal(verification.firstPassAccuracy, 83);
  assert.equal(verification.finalAccuracy, 96);
});
