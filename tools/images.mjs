#!/usr/bin/env node
/* ====================================================================
   Responsive image generator.

   The homepage shipped 945 KB of photographs: seven full-size JPEGs,
   the same bytes to a 390px phone as to a 1440px desktop. The hero
   alone was 402 KB. Every one of them is `position: absolute; inset: 0`
   with `object-fit: cover`, so the browser was downloading four to
   sixteen times the pixels it could ever paint.

   This writes a WebP ladder beside each original. The original JPEG
   stays exactly where it is and remains the <img src>, so the fallback
   path is unchanged for anything that cannot read WebP.

   Occasional use, like tools/ for the coverage map — this is still a
   site with no build step. Run it when a photograph is added or
   replaced, then commit what it writes.

     npm i sharp
     node tools/images.mjs           write any missing sizes
     node tools/images.mjs --force   rewrite everything

   Widths are not guesses. They come from measuring each image's
   rendered box at 390, 768 and 1440 CSS pixels and allowing for a 2x
   display; see the `sizes` attribute in index.html, which has to agree
   with the layout or the browser picks the wrong file.
   ==================================================================== */

import { readFileSync, writeFileSync, existsSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const FORCE = process.argv.includes('--force');

let sharp;
try {
  sharp = createRequire(import.meta.url)('sharp');
} catch {
  console.error('FAIL: sharp is not installed. Run:  npm i sharp');
  console.error('It is not a dependency of this site — there is no build step.');
  process.exit(1);
}

/* The hero is full-bleed (sizes="100vw") so it needs a finer ladder than
   the cards, which never render wider than ~588 CSS px. A width larger
   than the source is skipped rather than upscaled. */
const PLAN = [
  { file: 'hero-minibus.jpg',      widths: [640, 960, 1280, 1600, 1920] },
  { file: 'service-corporate.jpg', widths: [400, 800, 1200] },
  { file: 'service-school.jpg',    widths: [400, 800, 1200] },
  { file: 'airport-transfer.jpg',  widths: [400, 800, 1200] },
  { file: 'service-weddings.jpg',  widths: [400, 800, 1200] },
  { file: 'showcase-stadium.jpg',  widths: [400, 800, 1200] },
  { file: 'showcase-festival.jpg', widths: [400, 800, 1200] },
];

const QUALITY = 80;   // visually indistinguishable from the JPEG at these sizes
const kb = (n) => (n / 1024).toFixed(0).padStart(5) + ' KB';

let before = 0, after = 0, written = 0, skipped = 0;

for (const { file, widths } of PLAN) {
  const src = join(ROOT, 'assets', file);
  if (!existsSync(src)) { console.error(`missing: assets/${file}`); process.exitCode = 1; continue; }

  const meta = await sharp(src).metadata();
  const origBytes = statSync(src).size;
  before += origBytes;
  console.log(`\n${file}  (${meta.width}x${meta.height}, ${kb(origBytes).trim()} jpeg)`);

  for (const w of widths) {
    if (w > meta.width) { console.log(`  ${String(w).padStart(4)}w  skipped, wider than the source`); continue; }
    const out = join(ROOT, 'assets', file.replace(/\.jpe?g$/i, `-${w}.webp`));
    if (existsSync(out) && !FORCE) { skipped++; after += statSync(out).size; console.log(`  ${String(w).padStart(4)}w  exists`); continue; }
    const buf = await sharp(src).resize({ width: w, withoutEnlargement: true }).webp({ quality: QUALITY }).toBuffer();
    writeFileSync(out, buf);
    written++; after += buf.length;
    console.log(`  ${String(w).padStart(4)}w  ${kb(buf.length)}  ${out.split('/').pop()}`);
  }
}

console.log(`\nWrote ${written} file(s), ${skipped} already present.`);
console.log(`Originals kept as the <img src> fallback: ${kb(before).trim()} across ${PLAN.length} JPEGs.`);
