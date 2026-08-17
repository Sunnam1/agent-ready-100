# The Agent-Ready 100

An evidence-backed research system and one-page case study for Composio’s AI Product Ops take-home assignment.

Live case study: https://agent-ready-100.ilovetheguitarihave.chatgpt.site

Source repository: https://github.com/Sunnam1/agent-ready-100

## What is here

- data/apps.json — the normalized 100-app dataset.
- data/verification.json — a stratified 20-app manual cross-check, including misses and corrections.
- agent/research.mjs — the repeatable research QA agent.
- app/ — the self-explanatory case-study site.

## Run the research agent

Node 20+ is enough; the agent has no third-party runtime dependencies.

    node agent/research.mjs

It checks every official evidence URL, runs contradiction rules, separates guarded pages from broken sources, and writes work/research-report.json. Use --no-fetch to run only the structural checks.

The deliberately human step is the review queue: low-confidence vendors, pages blocked by authentication/anti-bot controls, and claims where “API documented” does not prove “production credentials obtainable.” The final dataset records those limitations instead of guessing.

## Run the case study

    npm install
    npm run dev

The page computes its headline metrics directly from data/apps.json; update a row and the charts, filters, and totals change with it.

## Method

1. Seed first-party developer entry points for all 100 apps.
2. Normalize five decision fields: auth, access, API breadth, MCP, and buildability.
3. Run mechanical URL and contradiction checks.
4. Route low-confidence and gated rows to browser/human review.
5. Re-check a deterministic 20-app sample across all ten categories.

Research date: 17 August 2026. Product access, pricing, and developer programs change; rerun the agent and re-check Low confidence rows before making outreach decisions.
