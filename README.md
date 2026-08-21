# Bux Travel — website

Push everything here to the root of `main`.

```
index.html  privacy.html  terms.html
.nojekyll   CNAME  robots.txt  sitemap.xml
assets/     <-- all 15 files
```

## ⚠️ Reviews section — do this before publishing

`index.html` has review cards with **placeholder slots**, shown on the page as dashed
champagne boxes. Search for `class="slot"` and replace:

- rating (currently `4.9`) and review count (currently `00`)
- three real reviews, copied word for word from your Google profile
- reviewer name and journey type under each

Do not invent reviews — fake testimonials breach the Digital Markets, Competition and
Consumers Act 2024. If you have fewer than three, delete the spare cards.

The reviews auto-scroll. The track contains each card **twice** so the loop is seamless —
if you edit a card, edit both copies, or the loop will jump.

## Page order

Hero → Services → Fleet & where it goes → Coverage → Reviews → Get a quote → FAQs → Footer

## Also check

- **"30 minutes"** appears in the hero, promise strip and FAQ. Change everywhere if unrealistic.
- **Cancellation table** in `terms.html` is an industry default — set it to yours.
- **ICO registration** — confirm live: https://ico.org.uk/ESDWebPages/Search

## Design system

| Token | Hex | Use |
|---|---|---|
| Ink 900 | `#0E1318` | Hero, dark bands, footer |
| Paper | `#F5F2EA` | Body background |
| Card | `#FCFAF4` | Cards on paper |
| Champagne | `#C9B79A` | Accent on dark |
| Champagne deep | `#8A7346` | Accent on paper |

Type: **Fraunces** (headings) + **Hanken Grotesk** (body).
Vehicle illustrations are inline SVG in `index.html` — edit the `<svg class="bus">` paths.
WhatsApp number `447581234042` — find and replace in all three files if it changes.
Credit links to https://ysbdesigns.uk/
