# Bux Travel — website

Static single-page site. Push the whole folder to the root of `main`.

## Files that MUST be uploaded

```
index.html
.nojekyll
CNAME
robots.txt
sitemap.xml
assets/          <-- all 14 files, or images will break
```

## assets/ contents

| File | Used for |
|---|---|
| hero-minibus.jpg | Full-bleed hero background |
| showcase-airport.jpg | "A typical week" tile 1 |
| showcase-stadium.jpg | "A typical week" tile 2 |
| showcase-festival.jpg | "A typical week" tile 3 |
| minibus-fleet.jpg | Spare (not currently placed) |
| bux-travel-mark.png | Logo mark in header + footer |
| favicon-32/180/512.png | Browser + home-screen icons |
| bux-travel-logo-dark/-light .png/.jpg | Lockups for external use |
| bux-travel-logo-stacked.jpg | Signage / vehicle vinyl |
| bux-travel-avatar.jpg | WhatsApp Business / social avatar |

## Design system

| Token | Hex | Use |
|---|---|---|
| Ink 900 | `#0E1318` | Hero, dark bands, footer |
| Ink 800 | `#12171D` | Secondary dark band |
| Paper | `#F5F2EA` | Body background |
| Card | `#FCFAF4` | Cards on paper |
| Line | `#E4DDCE` | Borders on paper |
| Champagne | `#C9B79A` | Accent on dark |
| Champagne deep | `#8A7346` | Accent on paper (contrast-safe) |

Type: **Fraunces** (headings, serif) + **Hanken Grotesk** (body).
Radius 14px, buttons 999px.

## Before going live

Search `index.html` for `TODO`:
- [ ] Email address
- [ ] Office hours
- [ ] Postcode
- [ ] PSV Operator Licence number
- [ ] Private Hire Operator Licence number
- [ ] Privacy policy link
- [ ] Update canonical / og:url / sitemap to the real domain

WhatsApp number appears as `447581234042` — find and replace if it changes.
