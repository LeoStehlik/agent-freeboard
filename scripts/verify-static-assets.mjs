#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, normalize } from "node:path";

const repoRoot = process.cwd();
const htmlFiles = ["index.html", "index-dev.html"];
const cssFiles = [
  "css/freeboard.css",
  "css/freeboard.min.css",
  "lib/css/freeboard/styles.css",
  "lib/css/thirdparty/codemirror-ambiance.css",
  "lib/css/thirdparty/codemirror.css",
  "lib/css/thirdparty/jquery.gridster.min.css"
];
const missing = [];

function checkReference(fromFile, ref) {
  if (!ref || ref.startsWith("#") || ref.startsWith("data:") || ref.startsWith("http://") || ref.startsWith("https://") || ref.startsWith("//")) {
    return;
  }

  const cleanRef = ref.split("#")[0].split("?")[0];
  if (!cleanRef) return;

  const path = normalize(join(repoRoot, dirname(fromFile), cleanRef));
  if (!existsSync(path)) {
    missing.push(`${fromFile} -> ${ref}`);
  }
}

for (const file of htmlFiles) {
  const html = readFileSync(file, "utf8");
  for (const match of html.matchAll(/(?:src|href)=["']([^"']+)["']/g)) {
    checkReference(file, match[1]);
  }
  for (const match of html.matchAll(/head\.js\(([^)]*)\)/gs)) {
    for (const quoted of match[1].matchAll(/["']([^"']+\.(?:js|css))["']/g)) {
      checkReference(file, quoted[1]);
    }
  }
}

for (const file of cssFiles) {
  const css = readFileSync(file, "utf8");
  for (const match of css.matchAll(/url\(["']?([^"')]+)["']?\)/g)) {
    checkReference(file, match[1]);
  }
}

if (missing.length) {
  console.error("Missing static assets:");
  for (const item of missing) console.error(`- ${item}`);
  process.exit(1);
}

console.log(`Static asset check passed for ${htmlFiles.length} HTML files and ${cssFiles.length} CSS files.`);
