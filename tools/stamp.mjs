#!/usr/bin/env node
/* ====================================================================
   Asset hash stamper.

   Every asset URL in this site carries a content hash: site.css?v=5ffc4743.
   There is no build step, so those hashes were stamped by hand — and a
   hand-stamped hash goes stale silently. A page shipped with the wrong
   hash looks fine to whoever shipped it and serves stale CSS to everyone
   who has visited before. It also guarantees a merge conflict on every
   page whenever two branches both touch an asset.

   This script recomputes every stamp from the file on disk. It is
   idempotent: running it twice changes nothing the second time.

     node tools/stamp.mjs            rewrite any stale hashes
     node tools/stamp.mjs --check    report and exit 1, change nothing

   It deliberately only corrects references that ALREADY carry ?v=. It
   will not add stamping to assets that do not have it (the photographs,
   currently) — that is a caching decision, not a bug to fix silently.
   Those are reported so the choice stays visible.
   ==================================================================== */

import { readdirSync, readFileSync, writeFileSync, existsSync } from 'fs';
import { createHash } from 'crypto';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CHECK = process.argv.includes('--check');

const hashOf = (file) =>
  createHash('md5').update(readFileSync(join(ROOT, 'assets', file))).digest('hex').slice(0, 8);

/* assets/<name>?v=<hash> — the name may contain dots and dashes */
const STAMPED = /assets\/([A-Za-z0-9._-]+)\?v=([A-Za-z0-9]*)/g;
/* a reference with no ?v= at all, for the advisory list */
const BARE = /["'(]\/?assets\/([A-Za-z0-9._-]+)["')]/g;

const cache = new Map();
function currentHash(name) {
  if (!cache.has(name)) cache.set(name, existsSync(join(ROOT, 'assets', name)) ? hashOf(name) : null);
  return cache.get(name);
}

const pages = readdirSync(ROOT).filter((f) => f.endsWith('.html')).sort();
const fixed = [];      // [page, asset, was, now]
const missing = [];    // [page, asset]  stamped but the file is gone
const unstamped = new Set();
let changedFiles = 0;

for (const page of pages) {
  const path = join(ROOT, page);
  const before = readFileSync(path, 'utf8');

  const after = before.replace(STAMPED, (match, name, was) => {
    const now = currentHash(name);
    if (now === null) { missing.push([page, name]); return match; }
    if (now !== was) fixed.push([page, name, was || '(empty)', now]);
    return `assets/${name}?v=${now}`;
  });

  for (const m of before.matchAll(BARE)) {
    if (currentHash(m[1]) !== null) unstamped.add(m[1]);
  }

  if (after !== before) {
    changedFiles++;
    if (!CHECK) writeFileSync(path, after);
  }
}

const w = (s, n) => String(s).padEnd(n);

if (fixed.length) {
  console.log(CHECK ? 'STALE HASHES:' : 'RESTAMPED:');
  for (const [page, name, was, now] of fixed) {
    console.log(`  ${w(page, 46)} ${w(name, 18)} ${was} -> ${now}`);
  }
}

if (missing.length) {
  console.log('\nSTAMPED BUT MISSING FROM assets/ (broken reference):');
  for (const [page, name] of missing) console.log(`  ${w(page, 46)} ${name}`);
}

if (unstamped.size) {
  console.log(`\nNote: ${unstamped.size} assets are referenced without ?v= and are not`);
  console.log('cache-busted. Deliberate for now; listed so it stays a choice:');
  console.log('  ' + [...unstamped].sort().join(', '));
}

if (missing.length) {
  console.error(`\nFAIL: ${missing.length} reference(s) point at a file that does not exist.`);
  process.exit(1);
}

if (CHECK) {
  if (fixed.length) {
    console.error(`\nFAIL: ${fixed.length} stale hash(es) across ${changedFiles} page(s).`);
    console.error('Run: node tools/stamp.mjs');
    process.exit(1);
  }
  console.log(`OK: every stamp across ${pages.length} pages matches the file on disk.`);
} else {
  console.log(changedFiles
    ? `\nRewrote ${fixed.length} stamp(s) across ${changedFiles} page(s).`
    : `Nothing to do — every stamp across ${pages.length} pages is already correct.`);
}
