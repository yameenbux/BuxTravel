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

`quote-acknowledgement-email.txt` is the plain-text half of the same message. Set
both parts: HTML-only mail scores worse with spam filters. If you edit one, edit
the other — they carry the same tags on purpose.

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

1. **Check your provider does autoresponders**, and on which tier. They are
   frequently a paid feature.
2. **Name the provider in section 6 of `privacy.html`**, "Who we share your
   information with". It becomes a processor handling customer names, numbers and
   email addresses on your behalf.
3. **Add its SPF and DKIM records to `buxtravel.co.uk`.** Without them this lands
   in spam, and a customer who never sees the acknowledgement concludes you never
   replied — worse than sending nothing.
4. **Send yourself a test to Outlook, Gmail and an iPhone.** A browser preview
   proves the markup holds together and nothing whatsoever about how it lands.

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
