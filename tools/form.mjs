#!/usr/bin/env node
/* ====================================================================
   Quote form checker.

     node tools/form.mjs            report
     node tools/form.mjs --check    report and exit 1 on any problem

   The booking form is the only place on the site where a stranger can
   hand us money, and every one of its failure modes is silent. The page
   looks perfect, the customer believes they got through, and nothing
   arrives. Nobody finds out except by wondering why the phone stopped.

   Written after exactly that happened. The spam trap was an input with
   id "q-company" and a label reading "Company", hidden by clipping
   rather than display:none so bots would still find it. Chrome's
   address autofill found it too — it reads a field labelled Company as
   the organisation field, and it ignores autocomplete="off" for profile
   fields by design. So a real visitor arrived, Chrome filled in the
   trap for them, and the form decided they were a bot and threw the
   enquiry away behind a "Thanks, we will be in touch."

   That shipped and ran for months. These checks are the ones that would
   have caught it on the day.
   ==================================================================== */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CHECK = process.argv.includes('--check');
const html = readFileSync(join(ROOT, 'index.html'), 'utf8');

const problems = [];
const fail = (what, why) => problems.push({ what, why });
const ok = [];

/* ---- 1. The trap must be invisible to autofill, not just to people --
   Browser address autofill matches on id, name, label and placeholder.
   Any of these words in any of those places and a real visitor gets
   filled in and then treated as a bot. This is the check that matters
   most: everything else here is structure, this one is the actual bug. */
const MAGNETS = [
  'company', 'organisation', 'organization', 'employer', 'business',
  'name', 'email', 'phone', 'tel', 'mobile', 'address', 'street',
  'town', 'city', 'county', 'postcode', 'zip', 'country', 'url',
];

const trap = html.match(/<div class="hp"[\s\S]*?<\/div>/);
if (!trap) {
  fail('spam trap', 'no <div class="hp"> block found — has the trap been removed?');
} else {
  const block = trap[0];
  const id = (block.match(/<input[^>]*\sid="([^"]*)"/) || [])[1] || '';
  const name = (block.match(/<input[^>]*\sname="([^"]*)"/) || [])[1] || '';
  const label = (block.match(/<label[^>]*>([^<]*)<\/label>/) || [])[1] || '';
  const place = (block.match(/<input[^>]*\splaceholder="([^"]*)"/) || [])[1] || '';

  const hits = [];
  for (const [field, value] of [['id', id], ['name', name], ['label', label], ['placeholder', place]]) {
    for (const word of MAGNETS) {
      if (value.toLowerCase().includes(word)) hits.push(`${field}="${value}" contains "${word}"`);
    }
  }
  if (hits.length) {
    fail('spam trap is autofillable',
      hits.join('; ') + '\n      A browser will fill this in for a real visitor, '
      + 'who is then treated as a bot.');
  } else {
    ok.push(`trap id="${id}" label="${label}" — no autofill magnets`);
  }

  if (!/tabindex="-1"/.test(block)) fail('spam trap', 'input is missing tabindex="-1", so it is keyboard reachable');
  if (!/aria-hidden="true"/.test(block)) fail('spam trap', 'block is missing aria-hidden="true"');
}

/* ---- 2. A filled trap must never block the customer ------------------
   Opening WhatsApp sends us nothing by itself — the customer still has
   to press send in the app — so there is nothing to protect there, and
   blocking it costs the enquiry. The trap gates the call to our own
   server and nothing else. */
if (!/if \(!trapped\(\)\) logQuietly\(d\);/.test(html)) {
  fail('spam trap wiring', 'logQuietly is not gated by trapped() — either the trap no longer '
    + 'protects the inbox, or it is gating something else');
} else {
  ok.push('trap gates logQuietly only');
}

const submitBody = (html.match(/form\.addEventListener\('submit'[\s\S]*?window\.open\(/) || [''])[0];
if (/trapped\(\)|q-hp|q-company/.test(submitBody)) {
  fail('spam trap wiring', 'the submit handler consults the trap before window.open — '
    + 'a false positive silently loses the enquiry, which is the bug this file exists for');
} else {
  ok.push('WhatsApp route reaches window.open unconditionally');
}

/* ---- 3. The exact regression --------------------------------------
   This string was shown to a real customer whose enquiry had just been
   discarded. Never tell someone we will be in touch when we have thrown
   away the only means of being in touch. */
if (html.includes('Thanks, we will be in touch.')) {
  fail('false reassurance', '"Thanks, we will be in touch." is back. It was the message shown '
    + 'to people whose enquiry had just been binned.');
} else {
  ok.push('no false-reassurance message');
}

/* ---- 4. The email button cannot appear unguarded -------------------
   Authored hidden and only revealed once a key is present, so a
   half-finished setup can never show a button that fails when pressed. */
const btn = (html.match(/<button[^>]*id="sendEmail"[^>]*>/) || [''])[0];
if (!btn) fail('email button', 'no #sendEmail button found');
else if (!/\shidden[\s>]/.test(btn)) {
  fail('email button', 'is not authored hidden, so it shows even with no key configured');
} else {
  ok.push('email button authored hidden');
}

/* ---- 5. Endpoint and key stay in step ------------------------------
   A key with no endpoint posts nowhere. Endpoint with no key is the
   designed inert state and is fine. */
const endpoint = (html.match(/var FORM_ENDPOINT = '([^']*)'/) || [])[1];
const key = (html.match(/var ACCESS_KEY = '([^']*)'/) || [])[1];
if (endpoint === undefined || key === undefined) {
  fail('form config', 'FORM_ENDPOINT or ACCESS_KEY declaration not found');
} else if (key && !endpoint) {
  fail('form config', 'ACCESS_KEY is set but FORM_ENDPOINT is empty — the enquiry posts nowhere');
} else {
  ok.push(key ? 'email route configured' : 'email route inert (no key), WhatsApp only');
}

/* ---- 6. Required fields must exist ---------------------------------
   validate() drives off a list of ids. A typo there does not throw; the
   field simply stops being required, or can never be satisfied. */
const req = (html.match(/var required = \[([^\]]*)\]/) || [])[1];
if (!req) fail('validation', 'could not find the required-field list in validate()');
else {
  const ids = req.split(',').map((s) => s.trim().replace(/^'|'$/g, '')).filter(Boolean);
  const missing = ids.filter((i) => !new RegExp(`id="q-${i}"`).test(html));
  if (missing.length) fail('validation', `required field(s) with no matching input: ${missing.join(', ')}`);
  else ok.push(`${ids.length} required fields all present`);
}

/* ---- report -------------------------------------------------------- */
for (const line of ok) console.log(`  ok    ${line}`);
for (const p of problems) console.log(`  FAIL  ${p.what}\n      ${p.why}`);

console.log(`\n${ok.length} check(s) passed, ${problems.length} problem(s).`);
if (problems.length) {
  console.error('\nFAIL: the quote form has a fault that loses enquiries silently.');
  process.exit(1);
}
if (CHECK) console.log('OK: the quote form holds together.');
