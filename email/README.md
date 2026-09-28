# Email templates

Two templates, designed in Claude Design and wired up here. They are real email
HTML — tables for layout, styles inline on every element, fixed 600px, no
flexbox, no grid, no custom properties, no web fonts, MSO conditionals, and no
images at all (most clients block them, so the masthead is drawn in type). Keep
to that if you edit them. A template built like a web page looks immaculate in a
browser and arrives in Outlook as a column of unstyled text.

| File | When it goes out | Can it be automated? |
|---|---|---|
| `quote-acknowledgement-email.*` | The moment someone submits the quote form | **Yes** — every tag comes from the form |
| `booking-confirmation-email.html` | After a price is agreed and the job is booked | **No** — see below |
| `signature.html` / `.txt` | Every email you send by hand | n/a — pasted into the mail client once |

`quote-acknowledgement-email.txt` is the plain-text half of the same message. Set
both parts: HTML-only mail scores worse with spam filters. If you edit one, edit
the other — they carry the same tags on purpose.

## The signature

`signature.html` holds two variants — open it in a browser, select the one you
want, copy, paste into the mail client. `signature.txt` is the plain-text
equivalent; set it as the plain-text alternative if your client allows one, and
keep the two in step.

**Full** goes on first contact with someone new. **Short** goes on replies: a
signature repeats on every message in a thread, and a six-line block quoted four
deep is how a conversation becomes unreadable.

`signature.html` now carries **three** blocks: **A** (logo mark plus live type,
recommended), **B** (dark band with the full lockup), and **SHORT** for replies.

### The logo, and the two rules that come with it

The logo is a real image, hosted on our own domain over HTTPS. It has to be:
email cannot use relative paths, and base64 data URIs are stripped by both Gmail
and Outlook.

Two rules follow, and neither is optional.

**`assets/bux-travel-mark-email.png` and `assets/bux-travel-lockup-email.png` can
never be renamed, moved or deleted.** Every email ever sent hotlinks them.
Breaking the URL retroactively breaks the signature in mail people already have,
going back however long. Replace the artwork only under a *new* filename — the
same rule the root README sets for `og:image`, for the same reason.

**They carry no `?v=` cache-bust, deliberately.** `tools/stamp.mjs` only stamps
relative references on the root pages, so it leaves these alone, which is
correct. A query string that rotated whenever an unrelated asset changed would
break the image in old mail.

Both were generated from the existing artwork rather than used raw. The full
lockups are 2400x760 with the logo occupying only **41% of the width** — pasted
straight in, the mark would render tiny inside a field of padding. The mark came
from `bux-travel-mark.png`, the only source file with a genuinely transparent
background, sized to 112px for a 56px display.

### Why A is the recommendation

Because images get blocked, and the two variants fail very differently. Rendered
with images off:

| | Blocked-image behaviour |
|---|---|
| **A** | Small empty placeholder, but **BUX TRAVEL still reads** — it is live type beside the mark, not part of it |
| **B** | Broken-image icon in the client's placeholder box on the dark band. The champagne alt text renders as designed, but the chrome around it looks broken |

B is the better-looking of the two when everything loads, and it matches the
website's dark bands. Use it if you prefer it — just choose it knowing how it
fails, because a meaningful share of recipients only ever see the failed state.

### Three other decisions worth not reversing

**The band in B is `#12171D`, not `--band` (#101418).** #12171D is the lockup
image's own background and the site's `theme-color`. Those darks are four shades
apart, which is enough that substituting `--band` shows the image as a faint
rectangle against the band.

**The accent is `--champ-deep` (#8A7346), not `--champ` (#C9B79A).** Champagne is
the accent for the website's dark bands. Measured against a white email
background it is **1.96:1** — effectively invisible. champ-deep is **4.54:1** and
passes AA. Champagne is still used *inside* the dark band in B, where it belongs.

**No web fonts.** Archivo and Barlow cannot load in email — Outlook ignores the
link and Gmail strips it. The stack falls back to the closest widely installed
grotesque.

Rendered block widths are 323px (A), 340px (B) and 243px (SHORT), all of which
clear a phone reply pane. An earlier draft measured 377 and 392 and overflowed;
the credential lines were shortened to fix it rather than left to wrap. **If you
add a line, re-measure.**

### Before you use it: the legal bit

UK trading disclosure rules require a business to identify itself on its
business correspondence, and email counts. **What you must show depends on how
Bux Travel is registered:**

- **Sole trader** — the proprietor's name and an address at which documents can
  be served.
- **Limited company** — the registered company name, company number, place of
  registration, and the registered office address.

The signature as written carries the name, phone, email and website, but **no
address and no company number.** Everything in this repo points to a sole trader,
in which case an address for service is the gap. That interacts with the decision
not to publish the street number on the website: an address for service does not
have to be a home address — an accountant's or a registered-office service
address is the usual answer where someone trades from home.

Confirm your own position rather than taking this paragraph as advice, then add
the line to both files.

## Merge tags

The names match the JSON the quote form posts, so the payload keys and the
template placeholders are one list rather than two that drift.

**From the form, automatically:**

```
{{ref}} {{name}} {{firstName}} {{phone}} {{email}} {{pickup}} {{dropoff}}
{{date}} {{time}} {{passengers}} {{journey}} {{notes}}
```

`{{ref}}` is generated in the browser (`BX-Q-<ddmm><4 digits>`) and appears in
the WhatsApp message, the logged record and the acknowledgement email — so an
email can be matched to a WhatsApp thread when both arrive from the same person
a minute apart. It is a handle for a human, not a guaranteed-unique key.

`{{firstName}}` is the first word of the name, split in the browser because the
templates greet on a first name and the form asks for a full one.

**Confirmation only, filled in by you:**

```
{{vehicle}} {{dateShort}} {{price}} {{deposit}} {{balance}}
{{paymentMethod}} {{paymentSummary}}
{{calStart}} {{calEnd}} {{pickupUrl}} {{dropoffUrl}} {{vehicleUrl}}
```

None of these exist when someone submits an enquiry — no price has been agreed
and no vehicle assigned. That is why the confirmation cannot be automated from
the form. It is a manual send, or driven by whatever you use to take payment.

The last five feed the "Add pick-up to your calendar" link and need specific
formats, because they sit inside a URL rather than in the body text:

| Tag | Format | Example |
|---|---|---|
| `{{calStart}}` `{{calEnd}}` | `YYYYMMDDTHHMMSSZ`, **UTC** | `20260924T031500Z` |
| `{{pickupUrl}}` `{{dropoffUrl}}` `{{vehicleUrl}}` | spaces as `+` | `14+Chorley+New+Road` |

Note the UTC part. A 04:15 pick-up in British Summer Time is `031500Z`. Get that
wrong and you send someone a calendar reminder an hour out, which on a 4am
airport run is the difference between catching the flight and not.

These were hardcoded in the template as supplied — every customer would have been
offered a reminder for 24 September 2026 at Chorley New Road. Now tagged.

Most providers use the double-brace form. Some use `%field%` or `*|FIELD|*`.
Check yours: a placeholder that does not match arrives as literal text in front
of a customer.

## Read this before using the confirmation

**The payment block assumes a deposit model your own site does not describe.** It
shows an agreed price, a deposit already taken on a card, and a balance due on
the day. The word "deposit" appears nowhere else on the site, and the FAQ says
one-off trips are "settled before or on the day".

One of the two is wrong. Either you take deposits and the site needs updating, or
you do not and that block needs rewriting. Do not send this template until they
agree — a customer who reads "deposit received" when none was taken will ask why,
and a customer who reads it on the site and is then asked for one on the day has
a fair complaint.

## Before switching the autoresponder on

The acknowledgement is sent by `one-com/quote-handler.php`, which reads these
two files at send time — so there is one copy of the wording, not two that
drift. Upload the templates beside the handler and re-upload when you edit them.

Because that handler runs on one.com, where the mailbox lives, **there is no SPF
or DKIM work and no third-party processor to name in `privacy.html`.** Both were
requirements of the form-service route and neither applies here. See
`one-com/README.md`.

What does still apply: **send yourself a test to Outlook, Gmail and an iPhone.**
A browser preview proves the markup holds together and nothing whatsoever about
how it lands.

## Suggested subject lines

| | |
|---|---|
| Acknowledgement | Got your request — fixed price coming shortly (ref {{ref}}) |
| Confirmation | You're booked in — {{dateShort}}, {{time}} (ref {{ref}}) |

Avoid "confirmation" in the acknowledgement subject. It sets the wrong
expectation before the message is even opened.

## No unsubscribe link, deliberately

Both are replies to something the customer started, so they are transactional
rather than marketing. Do not send anything promotional to these addresses
without a lawful basis and an unsubscribe link.
