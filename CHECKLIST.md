# Deployment Checklist

Before pushing to GitHub:

## 1. Update contact details in index.html
Search for `TODO` — each is highlighted in champagne on the site.
- [ ] Email address (bookings@buxtravel.co.uk)
- [ ] Office hours
- [ ] Postcode / address
- [ ] **PSV Operator Licence number**
- [ ] **Private Hire Operator Licence number**
- [ ] Privacy policy link

## 2. Update domain references
- [ ] `CNAME` — your real domain
- [ ] `index.html` → `<link rel="canonical">`
- [ ] `index.html` → `og:url`
- [ ] `sitemap.xml` → full URL

## 3. Push to GitHub
```bash
git add .
git commit -m "Bux Travel website launch"
git push origin main
```

## 4. Enable GitHub Pages
Settings → Pages → Source: Deploy from branch → main / (root) → Save

## 5. Set up custom domain
- Add CNAME record at registrar
- GitHub Pages will auto-verify HTTPS

## How to edit later

**Update images:** Replace files in `assets/` folder
**Update text:** Edit `index.html` directly
**Update email/hours:** Search for `TODO` in `index.html`

**To regenerate favicons from the logo:**
```bash
python3 - <<'PY'
from PIL import Image
for size in [32, 180, 512]:
    im = Image.open("assets/bux-travel-mark.png").convert("RGBA")
    im = im.resize((size,size), Image.LANCZOS)
    im.convert("RGB").save(f"assets/favicon-{size}.png")
PY
```

## Images included

- `minibus-fleet.jpg` — hero image
- `airport-transfer.jpg` — airport transfers card
- `sports-travel.jpg` — sports/events card
- `days-out-leisure.jpg` — leisure/groups card
- `bux-travel-logo-*.png` — logo in PNG (transparent)
- `bux-travel-logo-*.jpg` — logo in JPEG (opaque)
- `favicon-*.png` — browser icons
- `brand-sheet.png` — reference guide

All images are optimized for web.
