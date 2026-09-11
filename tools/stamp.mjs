#!/usr/bin/env node
/* ====================================================================
   Asset hash stamper.

   Every asset URL in this site carries a content hash: site.css?v=5ffc4743.
   There is no build step, so those hashes were stamped by hand — and a
   hand-stamped hash goes stale silently. A page shipped with the wrong
   hash looks fine to whoever shipped it and serves a stale file to
   everyone who has visited before. It also guarantees a merge conflict
   on every page whenever two branches both touch an asset.

   This script recomputes every stamp from the file on disk, and adds one
   to any relative asset reference that lacks it. It is idempotent:
   running it twice changes nothing the second time.

     node tools/stamp.mjs            add or correct stamps
     node tools/stamp.mjs --check    report and exit 1, change nothing

   It stamps RELATIVE src= and href= references only. Absolute URLs are
   left alone on purpose — see ABSOLUTE below.
   ==================================================================== */

import { readdirSync, readFileSync, writeFileSync, existsSync } from 'fs';
import { createHash } from 'crypto';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CHECK = process.argv.includes('--check');

const hashOf = (file) =>
  createHash('md5').update(readFileSync(join(ROOT, 'assets', file))).digest('hex').slice(0, 8);

/* src="assets/x.jpg"  href="/assets/x.png?v=abc123"
   The leading quote is what keeps this off absolute URLs: an og:image
   value starts "https:, so there is no quote immediately before assets/. */
const REF = /(\b(?:src|href)=")(\/?)assets\/([A-Za-z0-9._-]+)(\?v=[A-Za-z0-9]*)?"/g;

/* Absolute asset URLs — og:image, and logo/image in the JSON-LD — are
   deliberately NOT stamped. They are canonical identifiers that social
   scrapers and Google store and match on, and a query string that
   rotates whenever an unrelated file changes is more likely to confuse
   them than to solve a caching problem. Replace such an image under a
   new filename instead. */
const ABSOLUTE = /https:\/\/[^"']*\/assets\/([A-Za-z0-9._-]+)/g;

const cache = new Map();
function currentHash(name) {
  if (!cache.has(name)) cache.set(name, existsSync(join(ROOT, 'assets', name)) ? hashOf(name) : null);
  return cache.get(name);
}

const pages = readdirSync(ROOT).filter((f) => f.endsWith('.html')).sort();
const added = [];    // [page, asset, hash]        had no ?v= at all
const fixed = [];    // [page, asset, was, now]    had a stale one
const missing = [];  // [page, asset]              stamped but file is gone
const absolute = new Set();
let changedFiles = 0;

for (const page of pages) {
  const path = join(ROOT, page);
  const before = readFileSync(path, 'utf8');

  const after = before.replace(REF, (match, attr, slash, name, stamp) => {
    const now = currentHash(name);
    if (now === null) { missing.push([page, name]); return match; }
    const was = stamp ? stamp.slice(3) : null;
    if (was === null) added.push([page, name, now]);
    else if (was !== now) fixed.push([page, name, was || '(empty)', now]);
    return `${attr}${slash}assets/${name}?v=${now}"`;
  });

  for (const m of before.matchAll(ABSOLUTE)) absolute.add(m[1]);

  /* A rewrite must only ever insert "?v=<hash>" into an attribute value.
     If the character counts of the surrounding syntax move, the regex has
     eaten something it should not have — an earlier version of this
     script swallowed the closing quote of every href and shipped 20 pages
     of malformed HTML. Cheap structural check, run on every page. */
  const shape = (s) => [
    (s.match(/"/g) || []).length,
    (s.match(/</g) || []).length,
    (s.match(/>/g) || []).length,
  ].join(',');
  if (shape(after) !== shape(before)) {
    console.error(`\nFAIL: rewriting ${page} changed its structure ` +
                  `(quotes/angle brackets ${shape(before)} -> ${shape(after)}).`);
    console.error('Refusing to write. This is a bug in the stamper, not in the page.');
    process.exit(1);
  }

  if (after !== before) {
    changedFiles++;
    if (!CHECK) writeFileSync(path, after);
  }
}

const w = (s, n) => String(s).padEnd(n);
const verb = CHECK ? 'WOULD ADD' : 'ADDED';

if (added.length) {
  console.log(`${verb} (was unstamped):`);
  for (const [page, name, now] of added) console.log(`  ${w(page, 46)} ${w(name, 24)} -> ${now}`);
}

if (fixed.length) {
  console.log(CHECK ? '\nSTALE:' : '\nRESTAMPED:');
  for (const [page, name, was, now] of fixed) {
    console.log(`  ${w(page, 46)} ${w(name, 24)} ${was} -> ${now}`);
  }
}

if (missing.length) {
  console.log('\nREFERENCED BUT MISSING FROM assets/ (broken link):');
  for (const [page, name] of missing) console.log(`  ${w(page, 46)} ${name}`);
}

if (absolute.size) {
  console.log(`\nNot stamped, on purpose: ${absolute.size} asset(s) referenced by absolute URL`);
  console.log('(og:image and the JSON-LD logo). Replace one under a new filename rather');
  console.log('than in place: ' + [...absolute].sort().join(', '));
}

if (missing.length) {
  console.error(`\nFAIL: ${missing.length} reference(s) point at a file that does not exist.`);
  process.exit(1);
}

if (CHECK) {
  const stale = added.length + fixed.length;
  if (stale) {
    console.error(`\nFAIL: ${stale} reference(s) need stamping across ${changedFiles} page(s).`);
    console.error('Run: node tools/stamp.mjs');
    process.exit(1);
  }
  console.log(`OK: every asset reference across ${pages.length} pages is stamped and current.`);
} else {
  console.log(changedFiles
    ? `\nWrote ${added.length + fixed.length} stamp(s) across ${changedFiles} page(s).`
    : `Nothing to do — every reference across ${pages.length} pages is already correct.`);
}
