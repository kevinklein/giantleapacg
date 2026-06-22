#!/usr/bin/env node
const browserSync = require("browser-sync").create();
const { spawn } = require("child_process");

const ROOT = __dirname;
let watchProcess = null;

function startWatch() {
  watchProcess = spawn("node", ["watch.js"], { cwd: ROOT, stdio: "inherit" });
}

function shutdown() {
  if (watchProcess) {
    watchProcess.kill("SIGTERM");
  }
  browserSync.exit();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

startWatch();

browserSync.init({
  server: { baseDir: ROOT },
  port: 8765,
  open: false,
  notify: false,
  middleware: [
    (_req, res, next) => {
      if (_req.url.match(/\.(css|js)(\?|$)/)) {
        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      }
      next();
    },
  ],
  files: [
    "*.css",
    "*.js",
    "*.html",
    "img/**/*",
    "sprites/**/*",
  ],
  watchOptions: {
    awaitWriteFinish: {
      stabilityThreshold: 200,
      pollInterval: 100,
    },
    usePolling: true,
    interval: 300,
  },
});
