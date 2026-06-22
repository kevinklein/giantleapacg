#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const { PNG } = require("pngjs");

const SPONSORS_DIR = path.join(__dirname, "..", "img", "sponsors");
const THRESHOLD = 245;
const SOFT_RANGE = 15;

function knockoutWhite(inputPath) {
  const buffer = fs.readFileSync(inputPath);
  const png = PNG.sync.read(buffer);

  for (let i = 0; i < png.data.length; i += 4) {
    const r = png.data[i];
    const g = png.data[i + 1];
    const b = png.data[i + 2];
    const min = Math.min(r, g, b);
    const max = Math.max(r, g, b);

    if (min >= THRESHOLD) {
      png.data[i + 3] = 0;
      continue;
    }

    if (max >= THRESHOLD - SOFT_RANGE && max - min <= 20) {
      const fade = Math.max(0, max - (THRESHOLD - SOFT_RANGE)) / SOFT_RANGE;
      png.data[i + 3] = Math.round(png.data[i + 3] * fade);
    }
  }

  fs.writeFileSync(inputPath, PNG.sync.write(png));
}

for (const file of fs.readdirSync(SPONSORS_DIR)) {
  if (!file.endsWith(".png")) continue;
  const filePath = path.join(SPONSORS_DIR, file);
  knockoutWhite(filePath);
  console.log(`Processed ${file}`);
}
