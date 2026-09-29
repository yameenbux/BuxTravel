#!/usr/bin/env node
/* ======================================================================
   Quotation, invoice and receipt renderer.

     npm i playwright
     node documents/render.mjs documents/jobs/blackpool-trip.json

   Writes an A4 PDF into documents/out/. One template produces all
   three documents — set "type" to "quotation", "invoice" or "receipt"
   — so the wording, the letterhead and the figures cannot drift apart
   between the quote you sent, the invoice you raised from it and the
   receipt you issue on payment.

   A receipt requires "paidOn". That is deliberate: a receipt records
   that money ARRIVED, and issuing one before it has is how a supplier
   ends up with no claim on a balance it has already acknowledged.

   THE OUTPUT IS CHECKED BEFORE IT IS KEPT. The first version of this
   document silently lost its price table, its terms and its whole
   footer: the content ran 400mm down a 297mm page and `overflow:
   hidden` clipped it. A page-count check PASSED, because the clipping
   is what kept it to one page. So the guard below measures the real
   content height against the sheet and refuses to write a PDF that
   does not fit. Do not remove it; check the numbers it prints.

   This repository is public. Real job files live in documents/jobs/,
   which is gitignored, because they carry a customer's name and
   address. documents/example.json is fictional and is tracked.
   ====================================================================== */

import { readFileSync, writeFileSync, mkdirSync, existsSync, unlinkSync } from 'fs';
import { join, dirname, resolve, basename } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { createRequire } from 'module';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DOCS = join(ROOT, 'documents');

let chromium;
try {
  ({ chromium } = await import('playwright'));
} catch {
  try { ({ chromium } = createRequire('/usr/lib/node_modules/')('playwright')); }
  catch {
    console.error('FAIL: playwright is not installed.  npm i playwright');
    console.error('It is not a dependency of this site — there is no build step.');
    process.exit(1);
  }
}

const jobPath = process.argv[2];
if (!jobPath) { console.error('usage: node documents/render.mjs <job.json>'); process.exit(1); }
const job = JSON.parse(readFileSync(resolve(jobPath), 'utf8'));

/* ---- required fields, checked up front so a typo fails here rather
       than as a blank box on a document in front of a customer ---- */
/* journey and includes are required on a quotation and an invoice — a
   quote with no journey on it is not a quote. A receipt does not carry
   them: it acknowledges money, and the customer already has the
   booking details on the quotation. */
const need = ['type', 'ref', 'issued', 'customer', 'lines',
              ...(job.type === 'receipt' ? [] : ['journey', 'includes'])];
const missing = need.filter((k) => job[k] === undefined);
if (missing.length) { console.error('FAIL: job file is missing: ' + missing.join(', ')); process.exit(1); }
const TYPES = ['quotation', 'invoice', 'receipt'];
if (!TYPES.includes(job.type)) {
  console.error(`FAIL: type must be one of ${TYPES.join(', ')} — got "${job.type}"`); process.exit(1);
}
if (job.deposit !== undefined && (typeof job.deposit !== 'number' || job.deposit <= 0)) {
  console.error('FAIL: "deposit" must be a positive number.'); process.exit(1);
}
if (job.type === 'receipt' && !job.paidOn) {
  console.error('FAIL: a receipt needs "paidOn" — the date the money actually arrived.');
  console.error('Do not issue a receipt before the payment has landed.');
  process.exit(1);
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const money = (n) => (n < 0 ? '&minus;£' : '£') + Math.abs(n).toFixed(2);
const isQuote   = job.type === 'quotation';
const isReceipt = job.type === 'receipt';

/* ---- build the variable blocks ---- */
const refLabel = isQuote ? 'Quote no.' : isReceipt ? 'Receipt no.' : 'Invoice no.';
const metaRows = [
  [refLabel, job.ref],
  ['Date of issue', job.issued],
  ...(isQuote   ? (job.validUntil ? [['Valid until', job.validUntil]] : []) : []),
  ...(isReceipt ? [['Payment received', job.paidOn]] : []),
  ...(!isQuote && !isReceipt && job.dueDate ? [['Payment due', job.dueDate]] : []),
].map(([k, v]) => `<div><span class="k">${esc(k)}</span> &nbsp;<span class="v">${esc(v)}</span></div>`).join('\n');

const journeyBlock = job.journey?.length
  ? `<h2>${esc(job.journeyHeading ?? 'The journey')}</h2>\n<table class="detail">\n`
    + job.journey.map(([k, v]) => `<tr><td class="k">${esc(k)}</td><td>${v}</td></tr>`).join('\n')
    + '\n</table>'
  : '';

const includesBlock = job.includes?.length
  ? `<h2>${esc(job.includesHeading ?? (job.type === 'receipt' ? 'Your booking' : 'What the price includes'))}</h2>\n`
    + '<ul class="inc">\n' + job.includes.map((i) => `<li>${i}</li>`).join('\n') + '\n</ul>'
  : '';

const total = job.lines.reduce((a, l) => a + l.amount, 0);
const priceRows = job.lines.map((l, i) =>
  `<tr class="${l.amount < 0 ? 'disc ' : ''}${i ? 'sep' : ''}"><td>${l.desc}</td>` +
  `<td class="amt">${money(l.amount)}</td></tr>`).join('\n') +
  `\n<tr class="total"><td>${isQuote ? 'Total payable' : isReceipt ? 'Amount received' : 'Amount due'}</td>` +
  `<td class="amt">${money(total)}</td></tr>`;

/* The default terms box.

   This used to default to an empty string, which meant a quotation
   raised without someone remembering to write a note carried no terms
   at all — no deposit, no settlement, nothing. The site says a first
   booking is secured with a deposit (terms.html section 3, and the FAQ
   on the homepage), so a quote that stays silent and then springs one
   on acceptance contradicts our own published terms. The one care-home
   booking where that nearly happened only went smoothly because the
   customer thought to ask first.

   Set "deposit" on the job and the figures are stated exactly. Leave it
   out and the wording covers both cases without committing to a number,
   matching the site, which deliberately does not quote a percentage.

   A full "note" on the job still overrides all of this. */
function defaultNote() {
  if (isReceipt) return '';
  const fixed = 'It is agreed before you travel and does not change on the day.';

  const terms = job.deposit
    ? `A deposit of ${money(job.deposit)} secures the date, with the balance of ` +
      `${money(total - job.deposit)} due before travel.`
    : 'If this is your first booking with us, a deposit secures the date and the ' +
      'balance is due before travel. Otherwise the trip is settled before or on the day.';

  const accept = isQuote
    ? ' To accept this quotation, reply to the email it came with or call 07581&nbsp;234042.'
    : '';

  return `${fixed} ${terms}${accept}`;
}

if (job.deposit !== undefined && job.deposit >= total) {
  console.error(`FAIL: deposit ${money(job.deposit)} is not less than the total ${money(total)}.`);
  console.error('A deposit is a part payment; if it covers the whole job it is not a deposit.');
  process.exit(1);
}

const fill = {
  type: isQuote ? 'QUOTATION' : isReceipt ? 'RECEIPT' : 'INVOICE',
  subtitle: job.subtitle ?? (isQuote ? 'This is a quotation, not a request for payment.'
                                     : isReceipt ? 'Payment received with thanks.' : ''),
  partyLabel: isQuote ? 'Quotation for' : isReceipt ? 'Received from' : 'Invoice to',
  priceHeading: job.priceHeading ?? (isReceipt ? 'Payment received' : 'Price'),
  logo: pathToFileURL(join(ROOT, 'assets', 'bux-travel-lockup-print.png')).href,
  customerName: esc(job.customer.name),
  customerAddress: job.customer.address.map(esc).join('<br>'),
  fromName: esc(job.from?.name ?? 'Saeed Bux'),
  fromAddress: (job.from?.address ?? ['Bux Travel', 'Grasmere Street', 'Bolton BL1 8LH']).map(esc).join('<br>'),
  noteTitle: job.note?.title ?? (isReceipt ? 'Thank you' : 'This price is fixed.'),
  noteBody: job.note?.body ?? defaultNote(),
  ref: esc(job.ref),          // the <title>, which becomes the PDF's document title
  metaRows, journeyBlock, includesBlock, priceRows,
};

let html = readFileSync(join(DOCS, 'template.html'), 'utf8');
for (const [k, v] of Object.entries(fill)) html = html.replaceAll(`{{${k}}}`, v);
const left = html.match(/\{\{(\w+)\}\}/g);
if (left) { console.error('FAIL: template placeholders not filled: ' + [...new Set(left)].join(', ')); process.exit(1); }

mkdirSync(join(DOCS, 'out'), { recursive: true });
const tmp = join(DOCS, 'out', '.render.html');
writeFileSync(tmp, html);

/* --keep-html leaves the filled template beside the PDF. Useful when you
   are editing documents/template.html and want to open the real thing in
   a browser rather than guess from the PDF. */
const KEEP = process.argv.includes('--keep-html');

const outName = job.filename ?? `Bux-Travel-${fill.type[0] + fill.type.slice(1).toLowerCase()}-${job.ref}.pdf`;
const outPath = join(DOCS, 'out', outName);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 794, height: 1123 } });
await page.goto(pathToFileURL(tmp).href, { waitUntil: 'networkidle' });

/* ---- the guard ---- */
const fit = await page.evaluate(() => {
  const mm = (px) => +(px / 96 * 25.4).toFixed(1);
  const sheet = document.querySelector('.sheet');
  const foot = document.querySelector('footer');
  const prev = sheet.style.cssText;
  sheet.style.height = 'auto'; sheet.style.overflow = 'visible';
  const content = mm(sheet.getBoundingClientRect().height);
  sheet.style.cssText = prev;
  return { content, sheet: mm(sheet.getBoundingClientRect().height),
           footerBottom: mm(foot.getBoundingClientRect().bottom) };
});
console.log(`  content ${fit.content}mm   sheet ${fit.sheet}mm   footer ends ${fit.footerBottom}mm`);
if (fit.content > fit.sheet) {
  await browser.close(); unlinkSync(tmp);
  console.error(`\nFAIL: content is ${(fit.content - fit.sheet).toFixed(1)}mm too tall for the page.`);
  console.error('It would be silently clipped — the price and footer would go missing.');
  console.error('Shorten the job file, or loosen the layout in documents/template.html.');
  process.exit(1);
}

await page.pdf({ path: outPath, format: 'A4', printBackground: true,
                 margin: { top: '0', right: '0', bottom: '0', left: '0' } });
await browser.close();
if (KEEP) {
  const keep = outPath.replace(/\.pdf$/, '.html');
  writeFileSync(keep, html);
  console.log('  kept ' + keep.replace(ROOT + '/', ''));
} 
unlinkSync(tmp);

/* Chromium can still emit a trailing blank page; catch it rather than
   trust it. /Count lives in the Pages node of the output. */
const raw = readFileSync(outPath);
const count = /\/Type\s*\/Pages[\s\S]{0,120}?\/Count\s+(\d+)/.exec(raw.toString('latin1'));
const pages = count ? +count[1] : 0;
if (pages !== 1) {
  unlinkSync(outPath);
  console.error(`\nFAIL: rendered ${pages} pages, expected 1. Not keeping the file.`);
  process.exit(1);
}

console.log(`  pages 1   ${(raw.length / 1024).toFixed(0)} KB`);
console.log(`\nWrote ${outPath.replace(ROOT + '/', '')}`);
