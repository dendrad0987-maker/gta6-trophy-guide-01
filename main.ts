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

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

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
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, { text_max_bytes: 163840, screenshots: { max: 4, max_bytes: 262144 }, app_max_files: 993, app_max_bytes: 50331648 }),
);
