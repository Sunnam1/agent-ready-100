const escapeHtml = (value) => String(value ?? "").replace(/[&<>'"]/g, (character) => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  "'": "&#39;",
  '"': "&quot;",
}[character]));

const safeUrl = (value) => {
  try {
    const url = new URL(value, window.location.href);
    return ["http:", "https:"].includes(url.protocol) ? url.href : "#";
  } catch {
    return "#";
  }
};

const fetchJson = async (path) => {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`${path} returned ${response.status}`);
  return response.json();
};

const setAll = (selector, value) => {
  document.querySelectorAll(selector).forEach((element) => {
    element.textContent = value;
  });
};

const className = (value) => String(value).toLowerCase().replace(/[^a-z0-9]+/g, "");

const renderError = (error) => {
  console.error(error);
  const table = document.querySelector(".table-wrap");
  if (table) table.innerHTML = `<div class="empty">The research dataset could not be loaded. Open this page through a local web server or the deployed URL.</div>`;
};

try {
  const [apps, verification] = await Promise.all([
    fetchJson("./data/apps.json"),
    fetchJson("./data/verification.json"),
  ]);

  const count = (field, value) => apps.filter((app) => app[field] === value).length;
  const ready = count("verdict", "Ready");
  const conditional = count("verdict", "Conditional");
  const blocked = count("verdict", "Blocked");
  const buildable = ready + conditional;
  const selfServe = count("access", "Self-serve");
  const officialMcp = count("mcp", "Official");

  setAll("[data-ready]", ready);
  setAll("[data-conditional]", conditional);
  setAll("[data-blocked]", String(blocked).padStart(2, "0"));
  setAll("[data-buildable]", buildable);
  setAll("[data-self-serve]", selfServe);
  setAll("[data-official-mcp]", officialMcp);

  const split = [
    ["[data-ready-bar]", ready, "ready"],
    ["[data-conditional-bar]", conditional, "conditional"],
    ["[data-blocked-bar]", blocked, "blocked"],
  ];
  split.forEach(([selector, value, label]) => {
    const element = document.querySelector(selector);
    element.style.width = `${value}%`;
    element.textContent = `${value} ${label}`;
  });

  const authCounts = [
    ["OAuth support", apps.filter((app) => /oauth/i.test(app.auth)).length],
    ["Key / token path", apps.filter((app) => /key|token|secret/i.test(app.auth)).length],
    ["Basic auth", apps.filter((app) => /basic/i.test(app.auth)).length],
    ["No auth", apps.filter((app) => /^none$/i.test(app.auth)).length],
  ];
  document.querySelector("#auth-bars").innerHTML = authCounts.map(([label, value]) => `
    <div class="bar-row"><span>${escapeHtml(label)}</span><div><i style="width:${value}%"></i></div><b>${value}</b></div>
  `).join("");

  const categories = [...new Set(apps.map((app) => app.category))];
  document.querySelector("#category-bars").innerHTML = categories.map((category) => {
    const categoryApps = apps.filter((app) => app.category === category);
    const readyCount = categoryApps.filter((app) => app.verdict === "Ready").length;
    const accessSummary = ["Self-serve", "Mixed", "Gated"].map((access) => `${categoryApps.filter((app) => app.access === access).length} ${access.toLowerCase()}`).join(", ");
    const cells = categoryApps.map((app) => `<i class="cell ${app.access === "Self-serve" ? "self" : app.access.toLowerCase()}"></i>`).join("");
    return `<div class="category-row"><span title="${escapeHtml(category)}">${escapeHtml(category)}</span><div class="ten-cells" aria-label="${escapeHtml(accessSummary)}">${cells}</div><b>${readyCount}/10</b></div>`;
  }).join("");

  document.querySelector("#outreach-list").innerHTML = apps.filter((app) => app.verdict === "Blocked").map((app, index) => `
    <a href="${safeUrl(app.evidence[0])}" target="_blank" rel="noreferrer">
      <span>${String(index + 1).padStart(2, "0")}</span><strong>${escapeHtml(app.name)}</strong><small>${escapeHtml(app.blocker)}</small><b>↗</b>
    </a>
  `).join("");

  document.querySelector("#verification-method").textContent = verification.method;
  document.querySelector("#first-pass").textContent = `${verification.firstPassAccuracy}%`;
  document.querySelector("#final-pass").textContent = `${verification.finalAccuracy}%`;
  document.querySelector("#first-pass-bar").style.width = `${verification.firstPassAccuracy}%`;
  document.querySelector("#final-pass-bar").style.width = `${verification.finalAccuracy}%`;

  const hits = verification.checks.filter((check) => check.result === "Hit");
  const corrected = verification.checks.filter((check) => check.result === "Corrected");
  document.querySelector("#hit-count").textContent = `${hits.length} clean hits`;
  document.querySelector("#corrected-count").textContent = `${corrected.length} corrected`;

  const compactChecks = (checks) => checks.slice(0, 5).map((check) => `
    <a href="${safeUrl(check.source)}" target="_blank" rel="noreferrer"><b>${escapeHtml(check.app)}</b><span>${escapeHtml(check.finding)}</span><i>↗</i></a>
  `).join("");
  document.querySelector("#hit-checks").innerHTML = compactChecks(hits);
  document.querySelector("#corrected-checks").innerHTML = compactChecks(corrected);
  document.querySelector("#all-checks").innerHTML = verification.checks.map((check) => `
    <a href="${safeUrl(check.source)}" target="_blank" rel="noreferrer">
      <span class="pill ${check.result.toLowerCase()}">${escapeHtml(check.result)}</span><b>${escapeHtml(check.app)}</b><p>${escapeHtml(check.finding)}</p><i>Docs ↗</i>
    </a>
  `).join("");

  const categorySelect = document.querySelector("#category");
  categorySelect.insertAdjacentHTML("beforeend", categories.map((category) => `<option>${escapeHtml(category)}</option>`).join(""));

  const search = document.querySelector("#search");
  const verdict = document.querySelector("#verdict");
  const access = document.querySelector("#access");
  const rows = document.querySelector("#app-rows");
  const resultCount = document.querySelector("#result-count");
  const emptyState = document.querySelector("#empty-state");

  const renderTable = () => {
    const query = search.value.trim().toLowerCase();
    const filtered = apps.filter((app) => {
      const searchable = [app.name, app.category, app.does, app.auth, app.access, app.surface, app.mcp, app.verdict, app.blocker].join(" ").toLowerCase();
      return (!query || searchable.includes(query))
        && (categorySelect.value === "All" || app.category === categorySelect.value)
        && (verdict.value === "All" || app.verdict === verdict.value)
        && (access.value === "All" || app.access === access.value);
    });

    resultCount.textContent = `${filtered.length} / ${apps.length}`;
    emptyState.hidden = filtered.length !== 0;
    rows.innerHTML = filtered.map((app) => {
      const evidence = app.evidence.map((url, index) => `<a href="${safeUrl(url)}" target="_blank" rel="noreferrer">${index === 0 ? "Docs" : "MCP"} ↗</a>`).join("");
      return `<tr>
        <td><span>${String(app.id).padStart(2, "0")}</span><b>${escapeHtml(app.name)}</b><small>${escapeHtml(app.category)}</small></td>
        <td><b>${escapeHtml(app.auth)}</b><span class="access-badge ${className(app.access)}">${escapeHtml(app.access)}</span></td>
        <td><b>${escapeHtml(app.surface)}</b><small>${escapeHtml(app.does)}</small></td>
        <td><span class="mcp-badge ${className(app.mcp)}">${escapeHtml(app.mcp)}</span></td>
        <td><span class="verdict ${className(app.verdict)}">${escapeHtml(app.verdict)}</span><small>${escapeHtml(app.blocker)}</small></td>
        <td><div class="evidence-links">${evidence}</div><span class="confidence ${className(app.confidence)}"><i></i>${escapeHtml(app.confidence)}</span></td>
      </tr>`;
    }).join("");
  };

  [search, categorySelect, verdict, access].forEach((control) => control.addEventListener(control === search ? "input" : "change", renderTable));
  renderTable();

  const replayButton = document.querySelector("#replay-agent");
  const terminal = document.querySelector("#terminal-output");
  const auditLines = [
    "$ node agent/research.mjs",
    "",
    "✓ 100 apps normalized",
    "✓ 136 official evidence URLs checked",
    "✓ 134 reachable · 1 guarded · 1 failed",
    "! 7 contradiction / review warnings",
    "",
    "Report written to work/research-report.json",
  ];
  replayButton.addEventListener("click", async () => {
    replayButton.disabled = true;
    replayButton.textContent = "Replaying audit…";
    terminal.textContent = "";
    for (const line of auditLines) {
      terminal.textContent += `${line}\n`;
      await new Promise((resolve) => window.setTimeout(resolve, 180));
    }
    replayButton.disabled = false;
    replayButton.textContent = "Replay latest audit";
  });
} catch (error) {
  renderError(error);
}
