# Quotations, invoices and receipts

One template produces all three. That is the point: the wording, the letterhead
and the figures on the quote you sent, the invoice you raised from it and the
receipt you issue on payment cannot drift apart, because they come from the same
file.

```sh
npm i playwright
node documents/render.mjs documents/jobs/blackpool-trip.json
```

The PDF lands in `documents/out/`. `--keep-html` also writes the filled template
beside it, which is what you want when you are editing the layout.

`playwright` is **not** a dependency of this site — there is still no build step
and no `package.json`. Install it when you need to raise paperwork, the same
arrangement as `sharp` for the images and `dotted-map` for the coverage map.

## Making one

Copy `example.json` into `documents/jobs/`, edit it, run the renderer.

**`documents/jobs/` and `documents/out/` are gitignored, deliberately.** This
repository is public. A real job file carries a customer's name and address, and
`privacy.html` promises we do not hand that around. `example.json` is fictional,
which is why it is the only one tracked. **Do not put a real customer in
`example.json`.**

### The fields

| Field | |
|---|---|
| `type` | `"quotation"`, `"invoice"` or `"receipt"` — switches the title, the party label, the totals line ("Total payable" / "Amount due" / "Amount received"), the includes heading and which date is shown |
| `ref` | Your reference. Quotes follow the site's own scheme, `BX-Q-<ddmm><4 digits>` |
| `issued` | Date on the document |
| `validUntil` | Quotations only — a quote with no expiry is an open-ended offer |
| `dueDate` | Invoices only |
| `paidOn` | **Receipts only, and required** — the date the money actually arrived |
| `includesHeading` | Optional override, defaults to "What the price includes" |
| `customer` | `name` plus `address` as an array of lines |
| `from` | Optional; defaults to Saeed Bux / Grasmere Street |
| `journey` | Array of `[label, value]` pairs. The value takes HTML, so `<strong>` works. **Required on a quotation and an invoice; omit on a receipt** |
| `includes` | Array of bullet strings. Same rule — omit on a receipt |
| `journeyHeading` | Optional override, defaults to "The journey" |
| `priceHeading` | Optional override. Defaults to "Price", or "Payment received" on a receipt |
| `lines` | Array of `{desc, amount}`. A **negative** amount renders as a discount in champagne and the total is the sum |
| `note` | `{title, body}` for the box at the bottom |
| `filename` | Optional override for the output filename |

Values are HTML, not plain text, so `&mdash;` and `&nbsp;` work — and an
ampersand in a customer's name must be written `&amp;`. Names and addresses are
escaped for you; the journey, includes, lines and note are not, because they need
the markup.

## The guard, and why it is there

**The renderer refuses to write a PDF whose content does not fit the page.**

The first version of this document silently lost its price table, its terms and
its entire footer. The content ran 400mm down a 297mm page and `overflow: hidden`
clipped the bottom third. A page-count check *passed* — because the clipping is
precisely what kept it to one page. The document looked fine until you noticed
there was no price on it.

So `render.mjs` measures the real content height against the sheet before it
writes anything, and prints both numbers on every run:

```
  content 291mm   sheet 296.5mm   footer ends 296.5mm
  pages 1   134 KB
```

If the content is taller it exits 1, writes nothing, and tells you by how much.
It then re-reads the finished PDF and checks `/Count` is 1, deleting the file if
Chromium emitted a trailing blank page. **Do not remove either check**, and if you
add rows to a job, watch that `content` number.

It also fails fast on a missing required field, an unknown `type`, and any
`{{placeholder}}` the job did not fill — all of which are better as an error in
the terminal than as a blank box on a document in front of a customer.

**Keep a receipt short.** Omit `journey` and `includes` and those sections
disappear entirely — a receipt acknowledges money and says what is still owed.
The customer already has the journey on the quotation, and restating it turns a
one-glance confirmation into a document somebody has to read. The renderer still
*requires* both on a quotation and an invoice, where leaving out the journey
would make the document useless.

**A receipt without `paidOn` is refused.** A receipt is a record that money
*arrived*. Issuing one before it has is how a supplier ends up having
acknowledged a payment it never received, with no claim left on the balance. The
renderer will not produce one until you can name the date.

## If you change the layout

Two things in `template.html` look like ordinary CSS and are not:

- **`.sheet` uses `height`, not `min-height`.** A `min-height: 297mm` on a
  zero-margin A4 page rounds a fraction over and Chromium emits a blank second
  page.
- **`.rule` uses `flex: 0 0 2.2mm`, not `height`.** It is a flex child; a bare
  height gets shrunk to nothing and the champagne keyline silently disappears.
  It did.

There are no web fonts. Archivo and Barlow are not installed and the renderer has
no network, so the stack falls back to Liberation Sans, which is
metric-compatible with Arial. Do not add a font link — it will not load.

The letterhead uses `assets/bux-travel-lockup-print.png`, which is the dark
lockup trimmed of its 59% padding and sized for print. It is embedded in each
PDF rather than linked, so unlike the email-signature assets it can be replaced
freely.

## Still to settle

**Cancellation terms are not on the document.** The site says *"Cancellation terms
are set out with your quote."* They were left off rather than invented. Add them
to `note.body`, or as a row, once the operator has decided what they are — until
then the quotation contradicts the website.

**A quotation to a new customer should state the deposit in `note.body`.** The
site now says a first booking is secured with one (`terms.html` section 3, and
the FAQ on the homepage), so a quote that stays silent about it and then springs
a deposit on acceptance contradicts the published terms. Astley Grange only
worked out cleanly because they asked first.

**VAT is not shown.** Passenger transport in a vehicle constructed to carry ten
or more passengers is zero-rated, so a VAT-registered operator would want a line
saying so to pre-empt the question from a customer's finance team. A
non-registered operator must not mention VAT at all. Nothing is stated either way
until that is confirmed.
