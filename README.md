# Bux Travel — website

Push everything in this folder to the root of `main`.

```
index.html   privacy.html   terms.html
.nojekyll    CNAME          robots.txt    sitemap.xml
assets/      <-- all 15 files
```

## ⚠️ Do this before publishing — the reviews section

`index.html` has a Reviews section with **placeholder slots**, shown on the page in
dashed champagne boxes. Search `index.html` for `class="slot"`. Replace:

- The **rating** (currently `4.9`) with your actual Google rating
- The **review count** (currently `00`)
- **Three real reviews**, copied word for word from your Google profile
- The **reviewer name and journey type** under each

Do not invent reviews. Fake testimonials breach the Digital Markets, Competition and
Consumers Act 2024 and the CAP Code. Copy real ones or delete the three cards and keep
just the rating bar and the "Read all reviews" link.

If you have fewer than three reviews yet, delete the extra cards — one real review beats
three invented ones.

## Also check

- **"30 minutes"** appears in the hero, the FAQ and the promise strip as your quote
  response time. Change it everywhere if that isn't realistic — an unmet promise on the
  page is worse than no promise.
- **Cancellation table** in `terms.html` is a sensible industry default. Adjust the
  notice periods and charges to what you actually operate.
- **ICO registration** — confirm it's live before publishing: https://ico.org.uk/ESDWebPages/Search

## What's on the site

| Page | Contains |
|---|---|
| index.html | Hero, services, showcase, **reviews**, fleet, coverage, **FAQ**, process, quote form |
| terms.html | Quotes, payment, cancellation, waiting time, luggage, conduct, accessibility, liability |
| privacy.html | UK GDPR privacy policy, ICO details |

FAQ answers are marked up with FAQPage structured data, so Google can show them
directly in search results.

## Design system

| Token | Hex | Use |
|---|---|---|
| Ink 900 | `#0E1318` | Hero, dark bands, footer |
| Paper | `#F5F2EA` | Body background |
| Card | `#FCFAF4` | Cards on paper |
| Champagne | `#C9B79A` | Accent on dark |
| Champagne deep | `#8A7346` | Accent on paper |

Type: **Fraunces** (headings) + **Hanken Grotesk** (body).

WhatsApp number appears as `447581234042` — find and replace in all three files if it changes.
Credit links to https://ysbdesigns.uk/
