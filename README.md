# Bux Travel — website

Push everything here to the root of `main`.

```
index.html  privacy.html  terms.html  404.html
.nojekyll   CNAME  robots.txt  sitemap.xml
assets/     <-- 14 files
```

## What changed in this pass — a full checklist audit

Ran through 17 launch-readiness checks. Fixed:

- **Custom 404 page** — `404.html`, matches the site's design, links back to homepage/services/fleet/FAQ/quote. GitHub Pages serves this automatically for any unmatched URL — no extra config needed, it just has to exist at the repo root.
- **Favicon + social share (OG) tags on the legal pages** — `privacy.html` and `terms.html` previously had no Open Graph tags, so sharing either link on WhatsApp/iMessage/Facebook showed a blank card with no title or image. Both now match index.html's treatment.
- **Native form validation** — the quote form now has `required` on all mandatory fields (name, phone, email, pickup, dropoff, date, passengers), so if JavaScript fails to load for any reason, the browser still blocks an empty submission instead of silently opening a blank WhatsApp message.
- **Removed an unused image** — `minibus-fleet.jpg` was uploaded but not referenced by any page after the fleet section was redesigned. Deleted, saving ~200KB.

## Two items intentionally left as-is — your call, not a bug

- **Analytics:** still not installed. `privacy.html` explicitly promises "we do not use tracking cookies, advertising pixels or analytics that identify you" — adding Google Analytics would directly contradict that stated policy. If you want visitor numbers, a cookieless option (Plausible, Fathom) is a smaller policy change than GA4. Ask before adding either.
- **Reviews are still placeholders.** Unrelated to this pass — flagged in the previous round and still waiting on real review text from the Google profile.

## Already correct (confirmed, not changed)

Meta titles, meta descriptions, canonical URLs, alt text, accessibility (skip link, focus states, reduced-motion), mobile responsiveness, and internal link integrity were all checked and found correct — no changes needed.

## Design system

| Token | Hex | Use |
|---|---|---|
| Ink 900 | `#0E1318` | Hero, dark bands, footer, 404 |
| Paper | `#F5F2EA` | Body background |
| Champagne | `#C9B79A` | Accent on dark |
| Champagne deep | `#8A7346` | Accent on paper |

Type: **Fraunces** (headings) + **Hanken Grotesk** (body).
WhatsApp number `447581234042` — find/replace across all 4 HTML files if it changes.
Full reference: see `CLAUDE.md` and `design.md` if you have them from an earlier delivery.
