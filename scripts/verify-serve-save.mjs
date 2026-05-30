#!/usr/bin/env node
import { cpSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";

const tmp = mkdtempSync(join(tmpdir(), "agent-freeboard-serve-"));
const dashboardPath = join(tmp, "dashboard.json");
cpSync("examples/office-dashboard-editable.json", dashboardPath);

function waitForServer(url, timeoutMs = 5000) {
  const started = Date.now();
  return new Promise((resolve, reject) => {
    const poll = async () => {
      try {
        const response = await fetch(url);
        if (response.ok) return resolve();
      } catch {}
      if (Date.now() - started > timeoutMs) return reject(new Error("serve command did not start in time"));
      setTimeout(poll, 100);
    };
    poll();
  });
}

const port = 19080 + Math.floor(Math.random() * 1000);
const child = spawn(process.execPath, ["scripts/agent-freeboard.mjs", "serve", dashboardPath, "--port", String(port), "--write"], {
  stdio: ["ignore", "pipe", "pipe"],
});

let output = "";
child.stdout.on("data", (chunk) => { output += chunk; });
child.stderr.on("data", (chunk) => { output += chunk; });

try {
  await waitForServer(`http://127.0.0.1:${port}/dashboard.json`);
  const html = await fetch(`http://127.0.0.1:${port}/`).then((response) => response.text());
  if (!html.includes("Project Save Mode")) throw new Error("Project Save Mode status is missing from the editor header");
  if (!html.includes("project-save-toggle")) throw new Error("Project Save Mode checkbox is missing from the editor header");
  if (!html.includes("Load Project")) throw new Error("Load Project action is missing from the editor header");
  if (!html.includes("Load JSON")) throw new Error("Local dashboard import should be labelled Load JSON");
  if (html.includes("--write")) throw new Error("Project Save Mode UI still exposes CLI-only --write instructions");
  const capability = await fetch(`http://127.0.0.1:${port}/api/dashboard`).then((response) => response.json());
  if (!capability.writeEnabled) throw new Error("project save endpoint did not report write capability");
  const dashboard = await fetch(`http://127.0.0.1:${port}/dashboard.json`).then((response) => response.json());
  dashboard.panes[0].title = "Serve Save Smoke";

  const save = await fetch(`http://127.0.0.1:${port}/api/dashboard`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(dashboard),
  });
  if (!save.ok) throw new Error(`save endpoint returned ${save.status}: ${await save.text()}`);

  const saved = JSON.parse(readFileSync(dashboardPath, "utf8"));
  if (saved.panes[0].title !== "Serve Save Smoke") throw new Error("dashboard file was not updated");

  console.log("Serve save OK");
} finally {
  child.kill("SIGTERM");
  rmSync(tmp, { recursive: true, force: true });
}

child.on("exit", (code) => {
  if (code && code !== null) console.error(output);
});
