# Bux Travel — website

Static site. No build step, no framework, no package.json. Push to the root of
`main` and GitHub Pages deploys it.

```
index.html                       privacy.html   terms.html   404.html
airport-transfers.html           weddings.html
school-college-transport.html    days-out-sports.html
.nojekyll   CNAME   robots.txt   sitemap.xml
assets/     <-- 29 files
```

## Design system

| Token | Hex | Use |
|---|---|---|
| `--ink` | `#101418` | Body text, dark buttons |
| `--paper` | `#FFFFFF` | Page background |
| `--card` | `#F6F6F4` | Cards, form fields |
| `--line` | `#E2E2DE` | Borders on paper |
| `--muted` | `#5A6068` | Secondary text, map dots |
| `--champ` | `#C9B79A` | Accent on dark |
| `--champ-bright` | `#DFCBA8` | Highlights, selected states |
| `--champ-deep` | `#8A7346` | Accent on paper |
| `--band` | `#101418` | Dark section bands |
| `--band-deep` | `#080B0E` | Deepest bands, footer |

Type: **Archivo** (headings, nav, numerals) + **Barlow** (body). No serif is
defined anywhere on purpose. Archivo is loaded as a variable font
(`wght@100..900`) because the nav animates its weight per letter — the static
cuts cannot interpolate.

WhatsApp number `447581234042` and email `saeed@buxtravel.co.uk` appear across
all eight pages. Find and replace in all of them if either changes.

## JavaScript

Five files, all vanilla, all optional. Every one is progressive enhancement:
if it fails to load, the page underneath still works.

| File | Does |
|---|---|
| `reveal.js` | Scroll-entry animations on the four service pages |
| `datepicker.js` | Date of travel — trigger button + calendar popover |
| `timepicker.js` | Pick-up time — trigger button + hour/minute popover |
| `navtype.js` | Per-letter weight ripple on the nav |
| `fan.js` | The services card fan |

`index.html` carries its own inline script for the reviews wall, the hero
rotator, the scroll-spy and the quote form, rather than loading `reveal.js`.

**The pickers hide their native input** behind a class the script adds
(`.pick-native`). With JavaScript off, the ordinary `<input type="date">` and
`<input type="time">` are visible and fully working. The native input is always
the source of truth — the WhatsApp handoff reads it, not the trigger.

## Asset versioning

Every asset URL carries a content hash: `site.css?v=5ffc4743`. There is still no
build step — the deployed artifact is the committed HTML — but the hashes are no
longer maintained by hand.

```sh
node tools/stamp.mjs           # rewrite any stale hashes
node tools/stamp.mjs --check   # report and exit 1, change nothing
```

It is idempotent, and it only corrects references that already carry `?v=`. You
should rarely need to run it: **CI does it for you** (`.github/workflows/stamp.yml`).
A pull request that leaves a stale hash fails the check; a push to `main` gets
restamped and the correction pushed back as a bot commit.

Optionally catch it a few seconds earlier, before it is ever pushed:

```sh
git config core.hooksPath .githooks
```

That runs the stamper before each commit and re-stages only pages already in the
commit. Skip it once with `git commit --no-verify`.

### Why this is automated

A hand-stamped hash goes stale **silently.** The page looks correct to whoever
shipped it and serves a cached old stylesheet to everyone who has visited before.
It bit this repo twice: once when two branches both touched `site.css` and every
one of the eight pages conflicted on the stamp line, and once when two new pages
shipped pointing at a hash that no longer existed. A local hook alone would not
have caught either, because commits reach this repo from the web editor and from
agent sessions as well as from a checkout — hence the CI backstop.

Note this only busts the *assets*. It cannot help if a browser is holding a stale
`index.html`, because that copy still points at the old hashes.

**The photographs are not stamped.** Nine images (`hero-minibus.jpg`, the service
photos, the favicons) are referenced without `?v=`, so replacing one in place will
not reach returning visitors until their cache expires. That is the current
behaviour rather than a considered decision — `tools/stamp.mjs` lists them on every
run so the choice stays visible. Either stamp them too, or replace an image under
a new filename.

## The coverage map

`assets/uk-dots.svg` is 1,824 circles, generated offline — it is not drawn by
hand and not fetched at runtime. To change the shape or resolution you need
Node and the `dotted-map` package:

```sh
npm i dotted-map
```

Then generate the grid with `{ height: 78, grid: 'diagonal', countries: ['GBR'] }`,
and read city coordinates back out with `addPin()` + `getPoints()` so the arc
endpoints land on real dots. The arcs and their stagger live inline in
`index.html`; the `viewBox` must match the generated SVG exactly, or the two
layers will drift apart.

**The thirty arc endpoints are unlabelled on purpose.** A written list of the
destinations used to run underneath the map. It was removed to bring the
section down to the height of the fleet section above it, which was an explicit
call: the names went so the map could stay legible. The reach is now shown by
the arcs and stated in words by the "Nationwide work" copy, not enumerated.

If those city names are ever wanted back for search — they are the terms people
actually type — put them back as **visible** text. Do not hide them behind
`sr-only` or `display: none` to get the height back for free: a block of city
names visible only to crawlers is textbook hidden-text keyword stuffing, and
the penalty is worse than the ranking it buys.

## Reviews

The nine reviews in `index.html` are **real, from the Google profile, and
reproduced verbatim.** They are not placeholders. The only edit to any of them
is Peter Barkow's paragraph break, joined into one line so it sets as a single
quote.

Seven carry written text and are quoted. Two are a star rating with no written
review: they count toward the total of nine but there is nothing to display, so
`RATING` is `5.0` and `revCount` reads the array length.

To add a review, paste it into the `REVIEWS` array at the top of the inline
script with the reviewer's name and journey type. The section counts what it
finds and renders itself. Reviewers are shown as initials, never as a photo —
attaching a stock headshot to a real named customer would be a fabrication.

## Accessibility and motion

Everything animated is behind `prefers-reduced-motion`. The rule applied
throughout: **motion is withheld, information never is.** Under reduced motion
the review wall stops and shows every review in a static grid, the services fan
becomes a plain readable grid, and the coverage map draws complete and
immediately.

Durations come from three tokens and nothing is timed outside them:

| Token | Value | Use |
|---|---|---|
| `--d-1` | 200ms | Colour, small icon shifts |
| `--d-2` | 240ms | Borders, backgrounds, lifts |
| `--d-3` | 300ms | Reveals, panels, card transforms |

`--ease` is `cubic-bezier(0.23, 1, 0.32, 1)`. It never passes 1, so nothing
overshoots and nothing bounces back. **If you add a transition, use a token and
use `--ease`.** A spring curve was tried on the services fan and removed: it
overshot to 1.13 and took 520ms, which read as a wobble next to everything else
on the page.

Four things are deliberately off that scale, because they are narrative rather
than feedback: the coverage map draw, the home-marker pulse, the ambient sweep
on the primary button, and the review marquee. Clamping a 40s marquee to 300ms
would be nonsense.

**Scroll-reveal has a `<noscript>` guard in every page's `<head>`.** `.rev-in`
starts at `opacity: 0` and is revealed by script; with script off, nothing would
ever reveal it and the masthead would be invisible. The guard sets it back to
visible. If you add a page with `.rev-in`, copy the guard too.

Scroll-reveal is applied to mastheads, section heads and card grids. It is
deliberately **not** applied to the body prose in `privacy.html` and
`terms.html` — hiding paragraphs of legal text until they scroll into view helps
nobody reading a policy.

## Analytics — deliberately absent

`privacy.html` states "we do not use tracking cookies, advertising pixels or
analytics that identify you". Adding Google Analytics would contradict a
published policy. If visitor numbers are wanted, a cookieless option such as
Plausible or Fathom is a smaller policy change than GA4. Ask before adding
either.

## Unused assets

Several files in `assets/` are referenced by no page — logo variants in
multiple formats, `brand-sheet.png`, `favicon-512.png`, and the unused
photographs `days-out-leisure.jpg`, `showcase-airport.jpg` and
`sports-travel.jpg`. They are kept deliberately: the logo variants are source
artwork and the photographs are usable stock for future sections. Delete only
with the operator's say-so.
