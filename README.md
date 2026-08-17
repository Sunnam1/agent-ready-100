# The Agent-Ready 100

A static HTML case study for Composio’s AI Product Ops take-home assignment. The frontend uses only HTML, CSS, and vanilla JavaScript.

- Live case study: https://sunnam1.github.io/agent-ready-100/
- Source repository: https://github.com/Sunnam1/agent-ready-100

## Project files

- `index.html` — the complete one-page case study structure.
- `styles.css` — responsive visual design.
- `app.js` — dataset loading, metrics, filters, and audit replay.
- `build-static.mjs` — packages the same static files for the secondary Sites deployment.
- `data/apps.json` — normalized 100-app research dataset.
- `data/verification.json` — deterministic 20-app manual verification sample.
- `agent/research.mjs` — repeatable research QA agent.

## Run the research agent

Node.js 20+ is enough; the agent has no third-party runtime dependencies.

```bash
node agent/research.mjs
```

The agent checks every evidence URL, runs contradiction rules, separates guarded pages from broken sources, and writes `work/research-report.json`. To run only structural checks without network requests:

```bash
node agent/research.mjs --no-fetch
```

The human review queue covers low-confidence vendors, protected pages, and claims where documented APIs do not prove that production credentials are obtainable.

## Run the HTML page locally

Serve the repository directory with any static web server:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`. Opening `index.html` directly is not supported because browsers block local JSON requests.

## Validation

```bash
npm test
```

There are no packages to install; the `package.json` only provides build and test shortcuts.

Research date: 17 August 2026. Developer programs and access rules change; rerun the agent and re-check low-confidence rows before making outreach decisions.
