#!/usr/bin/env node
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { basename, dirname, extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const staticPaths = [
  "index.html",
  "css",
  "js",
  "img",
  "plugins",
  "lib/css",
  "lib/js",
];

function usage() {
  console.log(`agent-freeboard

Usage:
  agent-freeboard validate <dashboard.json>
  agent-freeboard create <spec.json> --out <dashboard.json>
  agent-freeboard deploy <dashboard.json> --out <directory>
  agent-freeboard serve <dashboard.json> [--port 8080] [--host 127.0.0.1] [--write]

Commands:
  validate  Check a Freeboard dashboard JSON file.
  create    Build a dashboard JSON file from an agent-friendly spec.
  deploy    Copy the static app plus a dashboard JSON into a deployable directory.
  serve     Serve the app locally, with optional write-back to the dashboard file.
`);
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    fail(`Could not read JSON from ${path}: ${error.message}`);
  }
}

function writeJson(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

function hasFlag(args, name) {
  return args.includes(name);
}

function option(args, name) {
  const index = args.indexOf(name);
  if (index === -1) return null;
  return args[index + 1] ?? fail(`Missing value for ${name}`);
}

function validateDashboard(dashboard, source = "dashboard") {
  const errors = [];

  if (!dashboard || typeof dashboard !== "object" || Array.isArray(dashboard)) {
    errors.push(`${source} must be a JSON object.`);
    return errors;
  }

  if (!Array.isArray(dashboard.datasources)) errors.push(`${source}.datasources must be an array.`);
  if (!Array.isArray(dashboard.panes)) errors.push(`${source}.panes must be an array.`);

  const datasourceNames = new Set();
  for (const [index, datasource] of (dashboard.datasources ?? []).entries()) {
    if (!datasource?.name) errors.push(`${source}.datasources[${index}].name is required.`);
    if (!datasource?.type) errors.push(`${source}.datasources[${index}].type is required.`);
    if (datasource?.name) {
      if (datasourceNames.has(datasource.name)) errors.push(`Duplicate datasource name: ${datasource.name}`);
      datasourceNames.add(datasource.name);
    }
  }

  for (const [paneIndex, pane] of (dashboard.panes ?? []).entries()) {
    if (!pane?.title) errors.push(`${source}.panes[${paneIndex}].title is required.`);
    if (!Array.isArray(pane?.widgets)) errors.push(`${source}.panes[${paneIndex}].widgets must be an array.`);
    for (const [widgetIndex, widget] of (pane?.widgets ?? []).entries()) {
      if (!widget?.type) errors.push(`${source}.panes[${paneIndex}].widgets[${widgetIndex}].type is required.`);
      if (!widget?.settings || typeof widget.settings !== "object") {
        errors.push(`${source}.panes[${paneIndex}].widgets[${widgetIndex}].settings must be an object.`);
      }
    }
  }

  return errors;
}

function validateCommand(args) {
  const dashboardPath = args[0] ?? fail("Usage: agent-freeboard validate <dashboard.json>");
  const dashboard = readJson(dashboardPath);
  const errors = validateDashboard(dashboard, dashboardPath);

  if (errors.length) {
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
  }

  console.log(`Dashboard OK: ${dashboardPath}`);
}

function datasourceFromSpec(datasource) {
  const type = datasource.type ?? "JSON";
  const settings = { ...(datasource.settings ?? {}) };

  if (type === "JSON") {
    if (datasource.url) settings.url = datasource.url;
    if (datasource.refresh != null) settings.refresh = datasource.refresh;
    settings.method ??= "GET";
    settings.body ??= "";
    settings.headers ??= [];
  }

  if (type === "MQTT") {
    if (datasource.broker) settings.broker_url = datasource.broker;
    if (datasource.client_id) settings.client_id = datasource.client_id;
    if (datasource.topics) settings.topics = datasource.topics;
  }

  return {
    name: datasource.name ?? fail("Each spec datasource needs a name."),
    type,
    settings,
  };
}

function widgetFromMetric(metric) {
  const kind = metric.kind ?? metric.type ?? "text";
  const title = metric.title ?? metric.name ?? fail("Each spec metric needs a title or name.");
  const value = metric.value ?? metric.path ?? fail(`Metric "${title}" needs a value expression.`);

  if (kind === "gauge") {
    return {
      type: "gauge",
      settings: {
        title,
        value,
        units: metric.units ?? "",
        min_value: metric.min ?? metric.min_value ?? 0,
        max_value: metric.max ?? metric.max_value ?? 100,
        show_value: metric.show_value ?? true,
      },
    };
  }

  if (kind === "indicator") {
    return {
      type: "indicator",
      settings: {
        title,
        value,
        on_text: metric.on_text ?? "On",
        off_text: metric.off_text ?? "Off",
      },
    };
  }

  if (kind === "html") {
    return {
      type: "html",
      settings: {
        html: value,
        height: metric.height ?? 4,
      },
    };
  }

  return {
    type: "text_widget",
    settings: {
      title,
      size: metric.size ?? "regular",
      value,
      sparkline: Boolean(metric.sparkline),
      animate: metric.animate ?? true,
      units: metric.units ?? "",
    },
  };
}

function createCommand(args) {
  const specPath = args[0] ?? fail("Usage: agent-freeboard create <spec.json> --out <dashboard.json>");
  const out = option(args, "--out") ?? fail("Usage: agent-freeboard create <spec.json> --out <dashboard.json>");
  const spec = readJson(specPath);

  if (!Array.isArray(spec.datasources) || spec.datasources.length === 0) {
    fail("Spec must include a non-empty datasources array.");
  }

  const panes = new Map();
  for (const metric of spec.metrics ?? []) {
    const paneName = metric.pane ?? "Dashboard";
    if (!panes.has(paneName)) {
      const paneWidth = metric.col_width ?? metric.width ?? 1;
      panes.set(paneName, {
        title: paneName,
        width: paneWidth,
        col_width: paneWidth,
        row: { "3": metric.row ?? Math.floor(panes.size / 3) * 7 + 1 },
        col: { "3": metric.col ?? (panes.size % 3) + 1 },
        widgets: [],
      });
    }
    panes.get(paneName).widgets.push(widgetFromMetric(metric));
  }

  const dashboard = {
    allow_edit: spec.allow_edit ?? true,
    header_image: spec.header_image ?? "",
    datasources: spec.datasources.map(datasourceFromSpec),
    panes: [...panes.values()],
  };

  const errors = validateDashboard(dashboard, out);
  if (errors.length) fail(errors.join("\n"));

  writeJson(out, dashboard);
  console.log(`Created dashboard: ${out}`);
}

function deployCommand(args) {
  const dashboardPath = args[0] ?? fail("Usage: agent-freeboard deploy <dashboard.json> --out <directory>");
  const out = resolve(option(args, "--out") ?? fail("Usage: agent-freeboard deploy <dashboard.json> --out <directory>"));
  const dashboard = readJson(dashboardPath);
  const errors = validateDashboard(dashboard, dashboardPath);
  if (errors.length) fail(errors.join("\n"));

  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });

  for (const item of staticPaths) {
    const from = join(repoRoot, item);
    if (existsSync(from)) cpSync(from, join(out, item), { recursive: true });
  }

  cpSync(resolve(dashboardPath), join(out, "dashboard.json"));
  writeJson(join(out, "agent-freeboard.json"), {
    dashboard: "dashboard.json",
    source: basename(dashboardPath),
    open: "index.html#source=dashboard.json",
  });

  console.log(`Deployed static dashboard bundle: ${out}`);
  console.log(`Open: ${join(out, "index.html")}#source=dashboard.json`);
}


const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".gif": "image/gif",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml; charset=utf-8",
};

function send(response, status, body, headers = {}) {
  response.writeHead(status, headers);
  response.end(body);
}

function sendJson(response, status, value) {
  send(response, status, `${JSON.stringify(value, null, 2)}\n`, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  });
}

function readRequestBody(request, limit = 5 * 1024 * 1024) {
  return new Promise((resolveBody, rejectBody) => {
    let body = "";
    request.setEncoding("utf8");
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > limit) {
        rejectBody(new Error("Request body is too large."));
        request.destroy();
      }
    });
    request.on("end", () => resolveBody(body));
    request.on("error", rejectBody);
  });
}

function serveStatic(requestPath, response) {
  let decodedPath;
  try {
    decodedPath = decodeURIComponent(requestPath === "/" ? "/index.html" : requestPath);
  } catch {
    send(response, 400, "Bad request\n", { "content-type": "text/plain; charset=utf-8" });
    return;
  }

  const candidate = resolve(repoRoot, `.${decodedPath}`);
  const relativePath = relative(repoRoot, candidate);

  if (relativePath.startsWith("..") || relativePath === "" || relativePath.split(/[\\/]/).includes("node_modules")) {
    send(response, 403, "Forbidden\n", { "content-type": "text/plain; charset=utf-8" });
    return;
  }

  if (!existsSync(candidate)) {
    send(response, 404, "Not found\n", { "content-type": "text/plain; charset=utf-8" });
    return;
  }

  send(response, 200, readFileSync(candidate), {
    "content-type": mimeTypes[extname(candidate).toLowerCase()] ?? "application/octet-stream",
  });
}

function serveCommand(args) {
  const dashboardPath = resolve(args[0] ?? fail("Usage: agent-freeboard serve <dashboard.json> [--port 8080] [--host 127.0.0.1] [--write]"));
  const port = Number(option(args, "--port") ?? 8080);
  const host = option(args, "--host") ?? "127.0.0.1";
  const writeEnabled = hasFlag(args, "--write");
  const dashboard = readJson(dashboardPath);
  const errors = validateDashboard(dashboard, dashboardPath);
  if (errors.length) fail(errors.join("\n"));
  if (!Number.isInteger(port) || port <= 0 || port > 65535) fail("--port must be a valid TCP port.");

  if (writeEnabled && !["127.0.0.1", "localhost", "::1"].includes(host)) {
    console.warn(`Warning: write mode is enabled while binding to ${host}. Only use this on a trusted network.`);
  }

  const server = createServer(async (request, response) => {
    const url = new URL(request.url, `http://${request.headers.host ?? `${host}:${port}`}`);

    if (request.method === "GET" && url.pathname === "/dashboard.json") {
      send(response, 200, readFileSync(dashboardPath), {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "no-store",
      });
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/dashboard") {
      sendJson(response, 200, { ok: true, writeEnabled, endpoint: "/api/dashboard" });
      return;
    }

    if (request.method === "PUT" && url.pathname === "/api/dashboard") {
      if (!writeEnabled) {
        sendJson(response, 403, { ok: false, error: "Project file save is disabled for this preview." });
        return;
      }
      try {
        const body = await readRequestBody(request);
        const nextDashboard = JSON.parse(body);
        const writeErrors = validateDashboard(nextDashboard, dashboardPath);
        if (writeErrors.length) {
          sendJson(response, 400, { ok: false, errors: writeErrors });
          return;
        }
        writeJson(dashboardPath, nextDashboard);
        sendJson(response, 200, { ok: true, path: dashboardPath });
      } catch (error) {
        sendJson(response, 400, { ok: false, error: error.message });
      }
      return;
    }

    if (request.method !== "GET" && request.method !== "HEAD") {
      send(response, 405, "Method not allowed\n", { "content-type": "text/plain; charset=utf-8" });
      return;
    }

    serveStatic(url.pathname, response);
  });

  server.listen(port, host, () => {
    const openUrl = `http://${host}:${port}/#source=/dashboard.json&edit=true${writeEnabled ? "&save=/api/dashboard" : ""}`;
    console.log(`Serving Agent Freeboard at ${openUrl}`);
    console.log(`Dashboard file: ${dashboardPath}`);
    console.log(`Write mode: ${writeEnabled ? "enabled" : "disabled"}`);
  });
}

const [command, ...args] = process.argv.slice(2);

if (!command || command === "--help" || command === "-h") {
  usage();
  process.exit(command ? 0 : 1);
}

if (command === "validate") validateCommand(args);
else if (command === "create") createCommand(args);
else if (command === "deploy") deployCommand(args);
else if (command === "serve") serveCommand(args);
else {
  usage();
  fail(`Unknown command: ${command}`);
}
