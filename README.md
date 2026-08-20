# Bux Travel — website

Single-page static site. Ready to deploy to GitHub Pages.

## Quick start

1. **Copy this entire folder to GitHub**
   - Push to `yameenbux/BuxTravel` repository, `main` branch, root directory
   - Everything must be in the root: `index.html`, `assets/`, `CNAME`, etc.

2. **Enable GitHub Pages**
   - Repo must be **public**
   - Settings → Pages → Source: *Deploy from branch* → `main` / `(root)` → Save
   - Wait ~5 minutes for the build

3. **Edit the TODOs**
   - Open `index.html` in a text editor
   - Search for `TODO` (highlighted in champagne on the live site)
   - Fill in your email, hours, licence numbers, postcode

4. **Set up custom domain** (optional but recommended)
   - Edit `CNAME` to your real domain (one line, no `https://`)
   - At your registrar's DNS: add `CNAME` record for `www` → `yameenbux.github.io`
   - Back in Settings → Pages, enter the domain → **Enforce HTTPS**
   - Wait ~24 hours for the certificate

## Files

| File | Purpose |
|---|---|
| `index.html` | The entire site — one file, 40KB |
| `assets/` | Logo, images, favicons |
| `CNAME` | Custom domain setting |
| `robots.txt` | Search engine instructions |
| `sitemap.xml` | URL list for search engines |
| `.nojekyll` | Tells GitHub not to process the site |

## Images

All optimized for web:

- **minibus-fleet.jpg** — hero image (your vehicle)
- **airport-transfer.jpg** — airport section
- **sports-travel.jpg** — sports/events section (Old Trafford)
- **days-out-leisure.jpg** — leisure section (Parklife festival)
- **bux-travel-logo-dark.png/jpg** — primary lockup
- **bux-travel-logo-light.png/jpg** — light background version
- **bux-travel-logo-stacked.jpg** — stacked version for signage/vinyl
- **bux-travel-avatar.jpg** — square version for WhatsApp/social
- **bux-travel-mark.png** — logo mark only
- **favicon-*.png** — browser and home-screen icons
- **brand-sheet.png** — reference guide

## Editing later

**Change images:** Replace files in `assets/`, keep the same filenames
**Change text or links:** Edit `index.html` directly
**Change email/hours/address:** Search for `TODO` in `index.html`
**Change WhatsApp number:** Find and replace `447581234042` throughout

## Design system

| Color | Hex | Use |
|---|---|---|
| Graphite | `#12171D` | Background |
| Panel | `#1A222A` | Cards, containers |
| Oyster | `#EDEAE4` | Text |
| Champagne | `#C9B79A` | Accent (logo, highlights) |
| Steel | `#7C8B99` | Secondary text |

**Typefaces:** Schibsted Grotesk (headings) + Instrument Sans (body) — loaded from Google Fonts

## Browser support

- Chrome, Edge, Safari, Firefox (latest 2 versions)
- iOS Safari, Chrome Android
- Respons ive down to 320px (old phones)
- No JavaScript required for core functionality
- Forms open WhatsApp with pre-filled enquiry

## Performance

- **40KB HTML** — includes all CSS and JavaScript
- **~1.2MB images** — all optimized JPEG/PNG
- **No dependencies** — fonts loaded from CDN
- **Zero build step** — just push to GitHub

## Before going live ⚠️

These are hard stops:

- [ ] **PSV Operator Licence number** — visible in footer
- [ ] **Private Hire Operator Licence number** — visible in footer
- [ ] **Real email address** — currently `bookings@buxtravel.co.uk`
- [ ] **Real phone number removed from view** — currently hidden (WhatsApp only)
- [ ] **Real office hours** — currently `TODO`
- [ ] **Privacy policy link** — currently links to `TODO`

You can launch without these, but they are compliance essentials. Corporate and school clients check the licence details first.

## Troubleshooting

**Images don't show:** Assets folder isn't in the right place. Should be `your-repo-root/assets/`

**Logo doesn't load:** Make sure `favicon-32.png` exists in `assets/`

**Site doesn't go live:** 
- Check repo is **public** (not private)
- Check Pages is enabled and set to `main` branch
- Check there are no build errors in Settings → Pages → deployments

**Custom domain issues:** 
- CNAME file must contain exactly one line: your domain name, nothing else
- DNS records take 5–48 hours to propagate
- HTTPS certificate can take up to 24 hours

## Support

This is a static site — no backend to maintain. Update it by editing files in the repo. Push changes, and they're live in seconds.

Questions? Check the CHECKLIST.md for step-by-step setup.
