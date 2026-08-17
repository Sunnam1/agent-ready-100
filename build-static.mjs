import { mkdir, readFile, rm, writeFile } from "node:fs/promises";

const root = new URL("./", import.meta.url);
const dist = new URL("./dist/", root);

const sources = [
  ["/", "index.html", "text/html; charset=utf-8"],
  ["/index.html", "index.html", "text/html; charset=utf-8"],
  ["/styles.css", "styles.css", "text/css; charset=utf-8"],
  ["/app.js", "app.js", "text/javascript; charset=utf-8"],
  ["/data/apps.json", "data/apps.json", "application/json; charset=utf-8"],
  ["/data/verification.json", "data/verification.json", "application/json; charset=utf-8"],
  ["/public/research-report.json", "public/research-report.json", "application/json; charset=utf-8"],
];

const files = [];
for (const [route, file, contentType] of sources) {
  files.push([route, { body: await readFile(new URL(file, root), "utf8"), contentType }]);
}

const worker = `const files = new Map(${JSON.stringify(files)});

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const path = decodeURIComponent(url.pathname).replace(/\\/+$/, "") || "/";
    const file = files.get(path);
    if (!file) return new Response("Not found", { status: 404 });

    const headers = new Headers({
      "content-type": file.contentType,
      "x-content-type-options": "nosniff",
      "cache-control": path === "/" || path === "/index.html" ? "no-cache" : "public, max-age=300",
    });
    return new Response(request.method === "HEAD" ? null : file.body, { status: 200, headers });
  },
};
`;

await rm(dist, { recursive: true, force: true });
await mkdir(new URL("./server/", dist), { recursive: true });
await writeFile(new URL("./server/index.js", dist), worker, "utf8");

console.log(`Built ${files.length} static routes in dist/server/index.js`);
