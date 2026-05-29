#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, normalize } from "node:path";

const repoRoot = process.cwd();
const dashboards = [
  "examples/freeboard-demo.json",
  "examples/office-dashboard.json",
  "examples/office-dashboard-editable.json",
  "examples/rl78.json",
  "examples/weather.json",
];
const missing = [];

function readJson(file) {
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch (error) {
    console.error(`Invalid dashboard JSON in ${file}: ${error.message}`);
    process.exit(1);
  }
}

function checkLocalReference(fromFile, ref) {
  if (!ref || /^https?:\/\//.test(ref) || ref.startsWith("//")) return;

  const cleanRef = ref.split("#")[0].split("?")[0];
  if (!cleanRef) return;

  const path = normalize(join(repoRoot, cleanRef));
  if (!existsSync(path)) {
    missing.push(`${fromFile} -> ${ref}`);
  }
}

for (const dashboardFile of dashboards) {
  const dashboard = readJson(dashboardFile);

  if (!Array.isArray(dashboard.panes)) {
    console.error(`${dashboardFile} must define a panes array.`);
    process.exit(1);
  }

  if (!Array.isArray(dashboard.datasources)) {
    console.error(`${dashboardFile} must define a datasources array.`);
    process.exit(1);
  }

  for (const datasource of dashboard.datasources) {
    if (datasource?.settings?.url) {
      checkLocalReference(dashboardFile, datasource.settings.url);
    }
    if (datasource?.settings?.datafile) {
      checkLocalReference(dashboardFile, datasource.settings.datafile);
    }
  }
}

if (missing.length) {
  console.error("Missing dashboard example assets:");
  for (const item of missing) console.error(`- ${item}`);
  process.exit(1);
}

console.log(`Dashboard example check passed for ${dashboards.length} dashboard files.`);
