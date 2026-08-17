"use client";

import { useMemo, useState } from "react";
import apps from "../data/apps.json";
import verification from "../data/verification.json";

const categories = [...new Set(apps.map((app) => app.category))];
const verdicts = ["All", "Ready", "Conditional", "Blocked"];
const accessModes = ["All", "Self-serve", "Mixed", "Gated"];
const count = (key: "verdict" | "access" | "mcp", value: string) =>
  apps.filter((app) => app[key] === value).length;
const pct = (value: number, total = apps.length) => Math.round((value / total) * 100);

const categoryStats = categories.map((category) => {
  const rows = apps.filter((app) => app.category === category);
  return {
    category,
    rows,
    ready: rows.filter((app) => app.verdict === "Ready").length,
    self: rows.filter((app) => app.access === "Self-serve").length,
    mixed: rows.filter((app) => app.access === "Mixed").length,
    gated: rows.filter((app) => app.access === "Gated").length,
    mcp: rows.filter((app) => app.mcp === "Official").length,
  };
});

const authStats = [
  { label: "OAuth support", value: apps.filter((app) => /oauth/i.test(app.auth)).length },
  { label: "Key / token path", value: apps.filter((app) => /api key|api token|access token|static token|pat|bearer/i.test(app.auth)).length },
  { label: "Basic auth", value: apps.filter((app) => /basic/i.test(app.auth)).length },
  { label: "No auth", value: apps.filter((app) => app.auth === "None").length },
];

const blocked = apps.filter((app) => app.verdict === "Blocked");
const correctedChecks = verification.checks.filter((check) => check.result === "Corrected");
const hitChecks = verification.checks.filter((check) => check.result === "Hit");

export default function Home() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [verdict, setVerdict] = useState("All");
  const [access, setAccess] = useState("All");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return apps.filter((app) => {
      const matchesQuery = !needle || [
        app.name, app.category, app.does, app.auth, app.surface, app.blocker, app.mcp,
      ].join(" ").toLowerCase().includes(needle);
      return matchesQuery
        && (category === "All" || app.category === category)
        && (verdict === "All" || app.verdict === verdict)
        && (access === "All" || app.access === access);
    });
  }, [query, category, verdict, access]);

  const copyTrigger = async () => {
    await navigator.clipboard.writeText("node agent/research.mjs");
  };

  return (
    <main>
      <section className="hero" id="top">
        <nav className="topbar">
          <a className="brand" href="#top"><span className="mark">C</span><span>Agent-Ready 100</span></a>
          <div className="navlinks">
            <a href="#findings">Findings</a><a href="#agent">Agent</a><a href="#proof">Proof</a><a href="#index">100-app index</a>
          </div>
          <span className="status"><i /> Verified · 17 Aug 2026</span>
        </nav>

        <div className="hero-copy">
          <p className="eyebrow">COMPOSIO · AI PRODUCT OPS FIELD STUDY</p>
          <h1>The market is API-rich.<br /><em>It is permission-poor.</em></h1>
          <p className="lede">
            Of 100 requested apps, <strong>93 are technically toolkit-buildable</strong>—but only <strong>64 offer a clean self-serve path</strong>.
            The constraint has shifted from endpoints to approvals, admin rights, and production access.
          </p>
        </div>

        <div className="scoreboard" aria-label="Headline findings">
          <article><span className="metric">68</span><span className="metric-label">Build now</span><small>Documented + usable today</small></article>
          <article><span className="metric">25</span><span className="metric-label">Conditional</span><small>Build after setup or approval</small></article>
          <article><span className="metric">07</span><span className="metric-label">Outreach</span><small>No self-serve route today</small></article>
          <article className="acid-card"><span className="metric">36</span><span className="metric-label">Official MCP</span><small>Vendor-owned agent surface</small></article>
        </div>
      </section>

      <section className="section" id="findings">
        <div className="section-head">
          <div><span className="section-no">01 / THE FINDINGS</span><h2>Permissioning is the real integration layer.</h2></div>
          <p>Public documentation is common. Production-ready credentials are not. A useful research system must score both—or it will systematically overstate what can ship.</p>
        </div>

        <div className="insight-grid">
          <article className="insight lead-insight">
            <span className="insight-kicker">The readiness gap</span>
            <strong>93%</strong>
            <h3>can become a toolkit</h3>
            <p>Yet 36% of the set is gated or mixed-access. “Has an API” and “can onboard a developer” are different facts.</p>
            <div className="gapbar" aria-label="Buildability split"><span style={{ width: "68%" }}>68 ready</span><span style={{ width: "25%" }}>25 conditional</span><span style={{ width: "7%" }}>7 blocked</span></div>
          </article>
          <article className="insight">
            <span className="insight-kicker">Easy-win cluster</span>
            <strong>20/20</strong>
            <h3>Developer + productivity apps are ready</h3>
            <p>They pair self-serve credentials with broad APIs. Eighteen already publish an official MCP server.</p>
          </article>
          <article className="insight">
            <span className="insight-kicker">Gate concentration</span>
            <strong>61%</strong>
            <h3>of gated apps sit in three categories</h3>
            <p>Marketing, ecommerce, and finance hold 11 of the 18 hard-gated rows—usually because of compliance, partner review, or paid access.</p>
          </article>
          <article className="insight">
            <span className="insight-kicker">The MCP wave</span>
            <div className="mcp-ring" aria-label="36 official MCP, 5 community MCP, 59 no MCP"><span>36</span><small>official</small></div>
            <h3>MCP is real, but uneven</h3>
            <p>Half of all official MCPs in this set come from developer and productivity tools. Marketing has zero.</p>
          </article>
        </div>

        <div className="analysis-grid">
          <article className="panel">
            <div className="panel-title"><div><span className="section-no">AUTH</span><h3>OAuth wins distribution. Tokens win first-run speed.</h3></div><span className="note">Methods overlap</span></div>
            <div className="bars">
              {authStats.map((stat) => (
                <div className="bar-row" key={stat.label}>
                  <span>{stat.label}</span><div><i style={{ width: `${stat.value}%` }} /></div><b>{stat.value}</b>
                </div>
              ))}
            </div>
            <p className="caption">Two-thirds support OAuth, while 58 offer a key/token route. The best toolkits support both: token for a fast internal proof, OAuth for safe distribution.</p>
          </article>

          <article className="panel">
            <div className="panel-title"><div><span className="section-no">CATEGORY × ACCESS</span><h3>Where the credentials are.</h3></div><span className="note">10 apps per row</span></div>
            <div className="category-bars">
              {categoryStats.map((stat) => (
                <div className="category-row" key={stat.category}>
                  <span>{stat.category}</span>
                  <div className="ten-cells" aria-label={`${stat.self} self-serve, ${stat.mixed} mixed, ${stat.gated} gated`}>
                    {Array.from({ length: stat.self }, (_, i) => <i className="cell self" key={`s${i}`} />)}
                    {Array.from({ length: stat.mixed }, (_, i) => <i className="cell mixed" key={`m${i}`} />)}
                    {Array.from({ length: stat.gated }, (_, i) => <i className="cell gated" key={`g${i}`} />)}
                  </div>
                  <b>{stat.ready}/10</b>
                </div>
              ))}
            </div>
            <div className="legend"><span><i className="self" /> Self-serve</span><span><i className="mixed" /> Mixed</span><span><i className="gated" /> Gated</span><span className="legend-end">right = ready</span></div>
          </article>
        </div>

        <article className="outreach">
          <div><span className="section-no">THE 7-APP OUTREACH QUEUE</span><h3>Don’t spend engineering time until access is real.</h3></div>
          <div className="outreach-list">
            {blocked.map((app) => (
              <a href={app.evidence[0]} target="_blank" rel="noreferrer" key={app.name}>
                <span>{String(app.id).padStart(2, "0")}</span><strong>{app.name}</strong><small>{app.blocker}</small><b>↗</b>
              </a>
            ))}
          </div>
        </article>
      </section>

      <section className="dark-section" id="agent">
        <div className="section-head inverse">
          <div><span className="section-no">02 / THE RESEARCH AGENT</span><h2>A loop that tries to disprove itself.</h2></div>
          <p>The pipeline treats every first-pass answer as a hypothesis. Mechanical checks find broken evidence and contradictions; browser and human checks resolve the rows that access walls make ambiguous.</p>
        </div>

        <div className="workflow">
          {[
            ["01", "Discover", "Start from the 100-app brief and first-party developer entry points."],
            ["02", "Normalize", "Map every app to auth, access, API breadth, MCP, verdict, and blocker."],
            ["03", "Critique", "Flag contradictions—especially “ready” rows with gated or undocumented auth."],
            ["04", "Verify", "Fetch 136 evidence URLs; separate live, guarded, and failed pages."],
            ["05", "Escalate", "Send low-confidence and account-walled claims to browser + human review."],
          ].map(([n, title, body]) => (
            <article key={n}><span>{n}</span><h3>{title}</h3><p>{body}</p></article>
          ))}
        </div>

        <div className="agent-proof" id="proof">
          <article className="terminal-card">
            <div className="terminal-top"><span><i /><i /><i /></span><b>RUNNABLE TRIGGER</b></div>
            <pre><code><span>$</span> node agent/research.mjs{"\n"}{"\n"}<em>100</em> apps normalized{"\n"}<em>136</em> evidence URLs checked{"\n"}<em>134</em> reachable · <em>1</em> guarded · <em>1</em> failed{"\n"}<em>7</em> review warnings queued</code></pre>
            <button onClick={copyTrigger}>Copy trigger</button>
          </article>
          <article className="human-card">
            <span className="section-no">WHERE A HUMAN WAS NEEDED</span>
            <h3>Pages prove syntax. They do not always prove access.</h3>
            <ul>
              <li><b>Account walls</b><span>Could credentials be created without a paid tenant?</span></li>
              <li><b>Production gates</b><span>Did sandbox access survive app review, KYC, or partner approval?</span></li>
              <li><b>Negative evidence</b><span>For Fanbasis, Waterfall, Paygent, and Consensus, “no public API found” remains explicitly low-confidence.</span></li>
            </ul>
            <div className="artifact-links">
              <a href="/apps.json" download>Download dataset <b>↓</b></a>
              <a href="/research-report.json" download>Download agent audit <b>↓</b></a>
              <a href="https://github.com/Sunnam1/agent-ready-100" target="_blank" rel="noreferrer">Source repository <b>↗</b></a>
            </div>
          </article>
        </div>
      </section>

      <section className="section verify-section">
        <div className="section-head">
          <div><span className="section-no">03 / VERIFICATION</span><h2>Accuracy moved because the agent was allowed to be wrong.</h2></div>
          <p>{verification.method}</p>
        </div>

        <div className="accuracy">
          <article><span>FIRST PASS</span><strong>{verification.firstPassAccuracy}%</strong><div><i style={{ width: `${verification.firstPassAccuracy}%` }} /></div><p>83 of 100 sampled field judgments matched first-party docs.</p></article>
          <div className="accuracy-arrow"><span>+13 pts</span>→</div>
          <article className="final-score"><span>AFTER VERIFICATION</span><strong>{verification.finalAccuracy}%</strong><div><i style={{ width: `${verification.finalAccuracy}%` }} /></div><p>Corrections were written back to the dataset; four judgments remain explicitly directional.</p></article>
        </div>

        <div className="verification-grid">
          <article>
            <div className="check-head"><span className="result-dot hit" /><div><b>{hitChecks.length} clean hits</b><small>Kept without material change</small></div></div>
            {hitChecks.slice(0, 5).map((check) => <a href={check.source} target="_blank" rel="noreferrer" key={check.app}><b>{check.app}</b><span>{check.finding}</span><i>↗</i></a>)}
          </article>
          <article>
            <div className="check-head"><span className="result-dot corrected" /><div><b>{correctedChecks.length} corrected</b><small>First-pass claim changed</small></div></div>
            {correctedChecks.slice(0, 5).map((check) => <a href={check.source} target="_blank" rel="noreferrer" key={check.app}><b>{check.app}</b><span>{check.finding}</span><i>↗</i></a>)}
          </article>
        </div>
        <details className="all-checks">
          <summary>See all 20 manual checks <span>+</span></summary>
          <div>
            {verification.checks.map((check) => (
              <a href={check.source} target="_blank" rel="noreferrer" key={check.app}>
                <span className={`pill ${check.result.toLowerCase()}`}>{check.result}</span><b>{check.app}</b><p>{check.finding}</p><i>Docs ↗</i>
              </a>
            ))}
          </div>
        </details>
      </section>

      <section className="index-section" id="index">
        <div className="index-head">
          <div><span className="section-no">04 / THE 100-APP INDEX</span><h2>Every claim, filterable and sourced.</h2></div>
          <p>Confidence measures the evidence, not product quality. Low-confidence rows are the honest boundary of public research.</p>
        </div>

        <div className="filters">
          <label className="search"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search app, auth, blocker…" aria-label="Search the app index" /></label>
          <label><span>Category</span><select value={category} onChange={(event) => setCategory(event.target.value)}><option>All</option>{categories.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label><span>Verdict</span><select value={verdict} onChange={(event) => setVerdict(event.target.value)}>{verdicts.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label><span>Access</span><select value={access} onChange={(event) => setAccess(event.target.value)}>{accessModes.map((item) => <option key={item}>{item}</option>)}</select></label>
          <b className="result-count">{filtered.length} / 100</b>
        </div>

        <div className="table-wrap">
          <table>
            <thead><tr><th># / App</th><th>Auth + access</th><th>API surface</th><th>MCP</th><th>Verdict / blocker</th><th>Evidence</th></tr></thead>
            <tbody>
              {filtered.map((app) => (
                <tr key={app.id}>
                  <td><span>{String(app.id).padStart(2, "0")}</span><b>{app.name}</b><small>{app.category}</small></td>
                  <td><b>{app.auth}</b><span className={`access-badge ${app.access.toLowerCase().replace("-", "")}`}>{app.access}</span></td>
                  <td><b>{app.surface}</b><small>{app.does}</small></td>
                  <td><span className={`mcp-badge ${app.mcp.toLowerCase()}`}>{app.mcp}</span></td>
                  <td><span className={`verdict ${app.verdict.toLowerCase()}`}>{app.verdict}</span><small>{app.blocker}</small></td>
                  <td><div className="evidence-links">{app.evidence.map((url, index) => <a href={url} target="_blank" rel="noreferrer" key={url}>{index === 0 ? "Docs" : "MCP"} ↗</a>)}</div><span className={`confidence ${app.confidence.toLowerCase()}`}><i /> {app.confidence}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="empty">No apps match those filters.</div>}
        </div>
      </section>

      <footer>
        <div><span className="mark">C</span><b>The Agent-Ready 100</b></div>
        <p>Research date: 17 August 2026 · First-party evidence preferred · Built as a Composio AI Product Ops field study</p>
        <a href="#top">Back to top ↑</a>
      </footer>
    </main>
  );
}
