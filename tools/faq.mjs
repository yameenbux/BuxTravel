#!/usr/bin/env node
/* ====================================================================
   FAQ schema checker.

   Every page with an FAQ carries the same questions twice: once as the
   <details> blocks a person reads, and once inside the FAQPage JSON-LD
   Google reads. They have to say the same thing.

     node tools/faq.mjs            report
     node tools/faq.mjs --check    report and exit 1 on any mismatch

   This is not a style rule. Google's structured data policy requires
   FAQPage content to be present and visible on the page; markup that
   says something the reader cannot see is ineligible at best. And the
   failure is completely silent — the page looks right, the schema
   validates, and the two simply disagree.

   Written while adding a deposit question, and it immediately found a
   pre-existing one: the 16-seater luggage answer had its closing
   sentence in the visible text and not in the schema. Nobody would
   ever have spotted that by eye.
   ==================================================================== */

import { readdirSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CHECK = process.argv.includes('--check');

/* Compare what a reader actually sees: tags gone, entities resolved,
   whitespace collapsed. Anything finer would fail on formatting that
   makes no difference to the words. */
const strip = (h) => h
  .replace(/<[^>]+>/g, '')
  .replace(/&amp;/g, '&').replace(/&mdash;/g, '—').replace(/&ndash;/g, '–')
  .replace(/&nbsp;/g, ' ').replace(/&rsquo;/g, '’').replace(/&lsquo;/g, '‘')
  .replace(/&pound;/g, '£').replace(/&quot;/g, '"').replace(/&middot;/g, '·')
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/\s+/g, ' ').trim();

const VISIBLE = /<summary>([\s\S]*?)<i><\/i><\/summary>\s*<div class="ans"><div><p>([\s\S]*?)<\/p>/g;
const LD = /<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/g;

let pages = 0, problems = 0;

for (const file of readdirSync(ROOT).filter((f) => f.endsWith('.html')).sort()) {
  const html = readFileSync(join(ROOT, file), 'utf8');

  const visible = new Map();
  for (const m of html.matchAll(VISIBLE)) visible.set(strip(m[1]), strip(m[2]));

  const schema = new Map();
  for (const m of html.matchAll(LD)) {
    let parsed;
    try { parsed = JSON.parse(m[1]); } catch { continue; }
    (function walk(node) {
      if (!node || typeof node !== 'object') return;
      if (node['@type'] === 'Question') schema.set(strip(node.name), strip(node.acceptedAnswer?.text ?? ''));
      Object.values(node).forEach(walk);
    })(parsed);
  }

  if (!visible.size && !schema.size) continue;
  pages++;

  const issues = [];
  if (visible.size && !schema.size) issues.push('page has an FAQ but no FAQPage schema');
  if (!visible.size && schema.size) issues.push('page has FAQPage schema but no visible FAQ');
  for (const [q, a] of visible) {
    if (!schema.has(q)) issues.push(`visible question is missing from the schema: "${q}"`);
    else if (schema.get(q) !== a) issues.push(`answer differs between page and schema: "${q}"`);
  }
  for (const q of schema.keys()) {
    if (!visible.has(q)) issues.push(`schema question is not visible on the page: "${q}"`);
  }

  const n = `${visible.size} visible / ${schema.size} in schema`;
  console.log(`  ${file.padEnd(48)} ${n.padEnd(26)} ${issues.length ? 'PROBLEM' : 'match'}`);
  for (const i of issues) { console.log(`      ${i}`); problems++; }
}

console.log(`\n${pages} page(s) with an FAQ, ${problems} problem(s).`);
if (problems) {
  console.error('\nFAIL: the FAQ a reader sees and the FAQ Google reads disagree.');
  console.error('Structured data must match the visible page. Fix the copy that is wrong.');
  process.exit(1);
}
if (CHECK) console.log('OK: every FAQ answer matches its schema.');
