// Ladle & Lantern — the hand-in program (Node 22, standard library only).
//
// The game itself is the game/ folder beside this file: plain static files that a desktop
// browser loads offline, no build step and no network request. This program copies game/ and
// screenshots/ into the output directory and writes dossier.json there with buildDossier from
// the vendored make.fun library, byte for byte the way the grader rebuilds it.
//
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// The caps mirror the gate's own limits, so an entry the scorer would refuse is refused here
// first: at most 4 screenshots of 256 KiB each, at most 993 files and 48 MiB under game/, no
// path under game/ longer than 1000 bytes, and the dossier's source text capped at 160 KiB.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);

console.log('Ladle & Lantern handed in: dossier.json is ' + statSync(join(out, 'dossier.json')).size + ' bytes in ' + out);
