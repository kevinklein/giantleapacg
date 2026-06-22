#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = __dirname;
const WATCH_PATHS = [
  path.join(ROOT, "src", "pages"),
  path.join(ROOT, "_includes"),
  path.join(ROOT, "sprites"),
];

let timer = null;

function runBuild() {
  const result = spawnSync("node", ["build.js"], { cwd: ROOT, stdio: "inherit" });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function scheduleBuild(label) {
  clearTimeout(timer);
  timer = setTimeout(() => {
    console.log(`Rebuilding (${label})...`);
    runBuild();
  }, 150);
}

function watchDir(dir) {
  fs.watch(dir, { recursive: true }, (_, filename) => {
    if (!filename || filename.endsWith("~")) return;
    scheduleBuild(path.join(path.relative(ROOT, dir), filename));
  });
}

runBuild();

for (const dir of WATCH_PATHS) {
  if (!fs.existsSync(dir)) {
    console.error(`Missing watch directory: ${dir}`);
    process.exit(1);
  }
  watchDir(dir);
}

console.log("Watching src/pages, _includes, and sprites...");
