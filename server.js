#!/usr/bin/env node
"use strict";
/*
  Lumen server: zero dependencies, Node 18 or newer.

  - Reads provider settings from .env (see .env.example)
  - Serves the ./public folder (and nothing else, so .env stays private)
  - GET /api/providers            -> provider names only, never keys
  - GET /api/proxy/<kind>/<id>/*  -> forwards to that provider with its key added

  Run:  node server.js   then open http://localhost:3000
*/
const http = require("http");
const fs = require("fs");
const path = require("path");

function loadEnv(file) {
  let txt;
  try { txt = fs.readFileSync(file, "utf8"); } catch (e) { return false; }
  for (const line of txt.split(/\r?\n/)) {
    if (line.trim().startsWith("#")) continue;
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!m) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"') && v.length > 1) || (v.startsWith("'") && v.endsWith("'") && v.length > 1)) {
      v = v.slice(1, -1);
    } else {
      v = v.replace(/\s+#.*$/, "");
    }
    if (!(m[1] in process.env)) process.env[m[1]] = v;
  }
  return true;
}

const hasEnv = loadEnv(path.join(__dirname, ".env"));

// A provider is any MOVIES_<NAME>_BASE_URL or SHORTS_<NAME>_BASE_URL that is filled in.
function discover(kind) {
  const re = new RegExp("^" + kind + "_([A-Z0-9]+)_BASE_URL$");
  const out = [];
  for (const k of Object.keys(process.env)) {
    const m = k.match(re);
    if (!m) continue;
    const name = m[1];
    const get = (s) => process.env[`${kind}_${name}_${s}`];
    const base = (process.env[k] || "").trim().replace(/\/+$/, "");
    if (!base) continue;
    try { new URL(base); } catch (e) { console.warn(`! ${k} is not a valid URL, skipped`); continue; }
    out.push({
      id: name.toLowerCase(),
      label: get("LABEL") || name,
      base,
      key: get("API_KEY") || "",
      header: get("AUTH_HEADER") || "Authorization",
      prefix: get("AUTH_PREFIX") !== undefined ? get("AUTH_PREFIX") : "Bearer ",
      queryParam: get("KEY_QUERY_PARAM") || "",
      extra: get("EXTRA_HEADERS") || ""
    });
  }
  return out;
}

const MOVIES = discover("MOVIES");
const SHORTS = discover("SHORTS");
const pub = (list) => list.map((p) => ({ id: p.id, label: p.label }));
const PUBLIC = path.join(__dirname, "public");
const TYPES = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg",
  ".webp": "image/webp", ".ico": "image/x-icon"
};

function serveStatic(res, pathname) {
  let rel;
  try { rel = decodeURIComponent(pathname); } catch (e) { return send(res, 400, "Bad path"); }
  if (rel === "/") rel = "/index.html";
  const file = path.join(PUBLIC, path.normalize(rel));
  if (!file.startsWith(PUBLIC + path.sep)) return send(res, 403, "Forbidden");
  const type = TYPES[path.extname(file).toLowerCase()];
  if (!type) return send(res, 404, "Not found");
  fs.readFile(file, (err, buf) => (err ? send(res, 404, "Not found") : send(res, 200, buf, type)));
}

function send(res, status, body, type) {
  res.writeHead(status, { "Content-Type": type || "text/plain; charset=utf-8", "Cache-Control": "no-store" });
  res.end(body);
}

async function proxy(res, kind, id, rest, search) {
  const list = kind === "movies" ? MOVIES : kind === "shorts" ? SHORTS : null;
  const p = list && list.find((x) => x.id === id);
  if (!p) return send(res, 404, "Unknown provider");

  let target, base;
  try {
    base = new URL(p.base);
    target = new URL(p.base + rest + search);
  } catch (e) { return send(res, 400, "Bad path"); }
  const basePath = base.pathname.replace(/\/$/, "");
  if (target.origin !== base.origin || !target.pathname.startsWith(basePath)) {
    return send(res, 400, "Blocked");
  }

  const headers = { Accept: "application/json" };
  if (p.key && p.queryParam) target.searchParams.set(p.queryParam, p.key);
  else if (p.key && p.header) headers[p.header] = p.prefix + p.key;
  for (const pair of p.extra.split(";")) {
    const i = pair.indexOf(":");
    if (i > 0) headers[pair.slice(0, i).trim()] = pair.slice(i + 1).trim();
  }

  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), 15000);
  try {
    const r = await fetch(target, { headers, signal: ac.signal });
    const body = Buffer.from(await r.arrayBuffer());
    if (!r.ok) {
      const shown = new URL(target);
      if (p.queryParam) shown.searchParams.delete(p.queryParam); // never print the key
      console.warn(`! ${p.label} answered ${r.status} for ${shown.href}`);
      console.warn(`  body: ${body.toString("utf8").slice(0, 200).replace(/\s+/g, " ")}`);
    }
    res.writeHead(r.status, {
      "Content-Type": r.headers.get("content-type") || "application/json",
      "Cache-Control": "no-store"
    });
    res.end(body);
  } catch (e) {
    send(res, 502, "Upstream error: " + (e.name === "AbortError" ? "timeout" : e.message));
  } finally {
    clearTimeout(timer);
  }
}

const server = http.createServer((req, res) => {
  if (req.method !== "GET" && req.method !== "HEAD") return send(res, 405, "Method not allowed");
  const u = new URL(req.url, "http://localhost");
  const parts = u.pathname.split("/"); // ["", "api", "proxy", kind, id, ...rest]

  if (u.pathname === "/api/providers") {
    return send(res, 200, JSON.stringify({ movies: pub(MOVIES), shorts: pub(SHORTS) }), "application/json");
  }
  if (parts[1] === "api" && parts[2] === "proxy" && parts[3] && parts[4]) {
    return proxy(res, parts[3], decodeURIComponent(parts[4]), "/" + parts.slice(5).join("/"), u.search);
  }
  serveStatic(res, u.pathname); // only ./public is ever served, so .env stays private
});

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || "127.0.0.1";
server.listen(PORT, HOST, () => {
  console.log(`Lumen running at http://${HOST === "0.0.0.0" ? "localhost" : HOST}:${PORT}`);
  console.log(hasEnv ? "Loaded .env" : "No .env found, copy .env.example to .env to add providers");
  const show = (n, l) => console.log(`  ${n}: ${l.length ? l.map((p) => p.label).join(", ") : "none (sample data)"}`);
  show("Movies", MOVIES);
  show("Shorts", SHORTS);
});