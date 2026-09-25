#!/usr/bin/env node
/* ====================================================================
   Sitemap lastmod stamper.

   sitemap.xml carried no <lastmod> at all. It is only a crawl hint and
   never a ranking factor, but this site has a crawl problem — pages
   published and still not indexed weeks later — and lastmod is exactly
   the hint worth sending.

   The dates are GENERATED, not typed. A hand-written lastmod is worse
   than none: Google ignores the field wholesale on sitemaps where it
   proves untrustworthy, and nineteen dates maintained by hand go stale
   silently, which is the same failure tools/stamp.mjs exists to prevent.

   The date for a page is the commit date of the last commit that
   touched it. A page with uncommitted edits is dated today, because it
   is about to be committed.

     node tools/sitemap.mjs            write lastmod dates
     node tools/sitemap.mjs --check    report and exit 1, change nothing

   It also checks the sitemap against the pages on disk in both
   directions, so a new page that never made it into sitemap.xml fails
   the build instead of quietly never being crawled.
   ==================================================================== */

import { readdirSync, readFileSync, writeFileSync, existsSync, statSync } from 'fs';
import { execFileSync } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CHECK = process.argv.includes('--check');
const SITEMAP = join(ROOT, 'sitemap.xml');

/* Pages deliberately absent from the sitemap. 404.html is noindex and
   is reached by a server rewrite, not by a URL anyone should crawl. */
const NOT_LISTED = new Set(['404.html']);

const today = () => new Date().toISOString().slice(0, 10);

const git = (...args) => {
  try {
    return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return '';   // no git, or a file git has never seen
  }
};

/* A shallow clone has no history to read a date OUT of: `git log -1`
   then returns the single available commit for every file, so every page
   looks modified today. In --check that is a spurious red build; writing
   would silently stamp 19 wrong dates, which is the exact failure this
   script exists to prevent. So refuse, loudly, rather than guess.
   CI must check out with fetch-depth: 0. */
if (git('rev-parse', '--is-shallow-repository') === 'true') {
  console.error('FAIL: this is a shallow clone, so per-file commit dates are not available.');
  console.error('Every page would be dated as though it changed in the tip commit.');
  console.error('Check out with full history instead — actions/checkout needs fetch-depth: 0.');
  process.exit(1);
}

/* Uncommitted edits mean the committed date is already wrong, so date
   the page today. Asked once, not once per page.

   Deliberately NOT `git status --porcelain`: its two-column status field
   is positional, and trimming the output strips the leading space of the
   first line, so a fixed slice then cuts one character too many and
   yields "ndex.html". These two commands emit bare paths instead —
   nothing to mis-slice. `diff --name-only HEAD` covers staged and
   unstaged alike; `ls-files --others` catches a brand-new page. */
const dirty = new Set([
  ...git('diff', '--name-only', 'HEAD', '--', '*.html').split('\n'),
  ...git('ls-files', '--others', '--exclude-standard', '--', '*.html').split('\n'),
].filter(Boolean));

/* Cache-bust stamps are not content. tools/stamp.mjs rewrites the
   ?v= hash on all twenty pages whenever site.css changes, so "the last
   commit that touched this file" would report every page as modified
   every time the stylesheet moves a pixel. A sitemap that says all
   nineteen pages changed today, every time, is exactly how Google
   learns to ignore lastmod — the failure this script exists to
   prevent. So compare pages with the stamps stripped out. */
const unstamped = (s) => s.replace(/\?v=[A-Za-z0-9]*/g, '');

const show = (sha, file) => {
  try {
    return execFileSync('git', ['show', `${sha}:${file}`], { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  } catch {
    return null;   // file did not exist at that commit
  }
};

function lastmodFor(file) {
  if (dirty.has(file)) {
    /* Even uncommitted, a stamp-only edit is not a modification. Compare
       the working copy against HEAD with the stamps removed before
       claiming today's date. */
    const head = show('HEAD', file);
    const now = readFileSync(join(ROOT, file), 'utf8');
    if (head === null || unstamped(head) !== unstamped(now)) return today();
  }

  const log = git('log', '--format=%H %cs', '--', file).split('\n').filter(Boolean);
  if (!log.length) return statSync(join(ROOT, file)).mtime.toISOString().slice(0, 10);

  /* Walk newest to oldest and stop at the first commit whose content
     actually differs from its predecessor's. */
  let newer = null;
  for (let i = 0; i < log.length; i++) {
    const [sha, date] = log[i].split(' ');
    const content = show(sha, file);
    if (content === null) continue;
    if (newer !== null && unstamped(newer.content) !== unstamped(content)) return newer.date;
    newer = { date, content };
  }
  return newer ? newer.date : log[log.length - 1].split(' ')[1];   // only ever one real version
}

/* https://www.buxtravel.co.uk/          -> index.html
   https://www.buxtravel.co.uk/x.html    -> x.html */
const fileFor = (loc) => {
  const path = loc.replace(/^https?:\/\/[^/]+\//, '');
  return path === '' ? 'index.html' : path;
};

const before = readFileSync(SITEMAP, 'utf8');
const listed = [...before.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

/* --- the two-way check, before touching anything ------------------- */
const onDisk = readdirSync(ROOT).filter((f) => f.endsWith('.html') && !NOT_LISTED.has(f)).sort();
const listedFiles = new Set(listed.map(fileFor));
const orphanPages = onDisk.filter((f) => !listedFiles.has(f));
const deadEntries = listed.filter((loc) => !existsSync(join(ROOT, fileFor(loc))));

if (orphanPages.length) {
  console.error('NOT IN sitemap.xml (will not be crawled):');
  for (const f of orphanPages) console.error(`  ${f}`);
}
if (deadEntries.length) {
  console.error('\nIN sitemap.xml BUT NOT ON DISK (will 404):');
  for (const loc of deadEntries) console.error(`  ${loc}`);
}
if (orphanPages.length || deadEntries.length) {
  console.error('\nFAIL: sitemap.xml and the pages on disk disagree.');
  process.exit(1);
}

/* --- write the dates ----------------------------------------------- */
const changes = [];   // [file, was, now]

const after = before.replace(
  /<loc>([^<]+)<\/loc>(\s*<lastmod>([^<]*)<\/lastmod>)?/g,
  (match, loc, existing, was) => {
    const file = fileFor(loc);
    const now = lastmodFor(file);
    if ((was ?? null) !== now) changes.push([file, was || '(none)', now]);
    return `<loc>${loc}</loc><lastmod>${now}</lastmod>`;
  }
);

/* The only legitimate change is inserting or rewriting a <lastmod>
   element, so the <loc> count must not move. Same reasoning as the
   structural guard in tools/stamp.mjs, and the same history behind it. */
const locs = (s) => (s.match(/<loc>/g) || []).length;
if (locs(after) !== locs(before)) {
  console.error(`\nFAIL: rewriting sitemap.xml changed its <loc> count ` +
                `(${locs(before)} -> ${locs(after)}). Refusing to write.`);
  console.error('This is a bug in tools/sitemap.mjs, not in the sitemap.');
  process.exit(1);
}

const w = (s, n) => String(s).padEnd(n);

/* One stream per outcome. A failing --check writes its rows to stderr
   alongside the summary, because stdout and stderr interleave
   unpredictably in a CI log and a list split across the failure message
   is harder to read than either half alone. */
const failing = CHECK && changes.length > 0;
const say = failing ? console.error : console.log;

if (changes.length) {
  say(CHECK ? 'WOULD SET:' : 'SET:');
  for (const [file, was, now] of changes) say(`  ${w(file, 48)} ${w(was, 12)} -> ${now}`);
}

if (CHECK) {
  if (changes.length) {
    console.error(`\nFAIL: ${changes.length} lastmod date(s) are missing or stale.`);
    console.error('Run: node tools/sitemap.mjs');
    process.exit(1);
  }
  console.log(`OK: all ${listed.length} sitemap entries carry a current lastmod.`);
} else if (after !== before) {
  writeFileSync(SITEMAP, after);
  console.log(`\nWrote ${changes.length} lastmod date(s) across ${listed.length} entries.`);
} else {
  console.log(`Nothing to do — all ${listed.length} entries already current.`);
}
