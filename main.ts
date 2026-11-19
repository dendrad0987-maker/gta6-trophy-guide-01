// Leonida Legend — the entrypoint for gta6-trophy-guide-01 (Node 22, standard library only).
//
// The guide itself is the static site in app/ (index.html, style.css, app.js and
// data/trophies.json): it opens in a desktop browser with no build step and no network.
// This program hands it in: it copies app/ and screenshots/ from beside this file into
// the output directory and writes output/dossier.json with the vendored make.fun library,
// which is the summary the judge reads (screenshots, first-load files and bytes, source).
// vendor/makefun-frontend.ts must stay exactly as the kit shipped it — the scorer rebuilds
// the dossier with its own copy and the two must match byte for byte.
//
// Run it locally with:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Serve the guide locally with `node serve.ts`, then open http://localhost:8080.

import { cpSync, existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Fail fast with a clear message instead of handing in a broken guide:
// the entry is invalid without its index page, and the scorer refuses
// fewer than 3 or more than 4 screenshots.
if (!existsSync(join(here, 'app', 'index.html'))) {
  throw new Error('missing app/index.html — cannot build the guide');
}
const shotDir = join(here, 'screenshots');
const shotCount = existsSync(shotDir)
  ? readdirSync(shotDir).filter((name) => !name.startsWith('.')).length
  : 0;
if (shotCount < 3 || shotCount > 4) {
  throw new Error(`expected 3 or 4 screenshots, found ${shotCount}`);
}

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// The scorer's caps: text_max_bytes shapes the dossier text; the other caps refuse an
// entry the scorer would refuse (more than 4 screenshots, one over 256 KiB, more than
// 993 files / 48 MiB under app/). app/ shares /output's own 1000-entry cap with
// screenshots/ and dossier.json, so the guide is kept well under those limits.
const dossier = buildDossier(out, { text_max_bytes: 163840, screenshots: { max: 4, max_bytes: 262144 }, app_max_files: 993, app_max_bytes: 50331648 });
writeFileSync(join(out, 'dossier.json'), dossier);

// Summarise the build on stdout so a run's result is visible at a glance.
function countFiles(dir: string): number {
  let total = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    total += entry.isDirectory() ? countFiles(join(dir, entry.name)) : 1;
  }
  return total;
}
console.log(
  `built guide: ${countFiles(join(out, 'app'))} app files, ${shotCount} screenshots, dossier.json ${Buffer.byteLength(dossier, 'utf8')} bytes -> ${out}`,
);
