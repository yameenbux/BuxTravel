# Bux Travel — website

Single-page static site. No build step, no dependencies to install.

## Files

| File | Purpose |
|---|---|
| `index.html` | The entire site — HTML, CSS and JS in one file |
| `CNAME` | Custom domain for GitHub Pages. **Edit this to your real domain.** |
| `.nojekyll` | Stops GitHub running Jekyll over the files |
| `robots.txt` | Search engine directives |
| `sitemap.xml` | Single-URL sitemap. Update the domain to match `CNAME`. |

## Deploying to GitHub Pages

1. Push these files to the **root** of the `main` branch of `yameenbux/BuxTravel`.
2. Make the repository **public** (Pages is only free on public repos).
3. Repo → **Settings → Pages** → Source: *Deploy from a branch* → Branch: `main`, folder: `/ (root)` → Save.
4. Wait a minute, then check `https://yameenbux.github.io/BuxTravel/`.

## Custom domain

1. Edit `CNAME` to your actual domain, one line, no `https://`. Currently set to
   `www.buxtravel.co.uk`.
2. At your domain registrar's DNS:
   - **`www` subdomain (recommended):** add a `CNAME` record for `www` pointing to
     `yameenbux.github.io`
   - **apex/root domain** (`buxtravel.co.uk` with no `www`): add four `A` records
     pointing to `185.199.108.153`, `185.199.109.153`, `185.199.110.153`,
     `185.199.111.153`
   - Best practice is to use `www` as the canonical domain and redirect the apex to it
     at the registrar.
3. Back in **Settings → Pages**, enter the domain and tick **Enforce HTTPS** once the
   certificate has been issued (can take up to 24 hours).

## Before going live — must do

Search `index.html` for `TODO`. Every one is highlighted in amber on the page so you
can't miss them:

- [ ] Email address (currently `bookings@buxtravel.co.uk`)
- [ ] Office hours
- [ ] Postcode / trading address
- [ ] **PSV Operator Licence number**
- [ ] **Bolton Council Private Hire Operator Licence number**
- [ ] Privacy policy link
- [ ] Update `canonical`, `og:url`, `sitemap.xml` and the JSON-LD `url` to the real domain
- [ ] Replace the fleet section with your actual vehicles, and add real photos of them
- [ ] Delete any service claim that isn't true (flight tracking, vetted drivers,
      scheduled inspection programme)

## Changing the WhatsApp number

The number appears in several places as `447581234042` (UK country code, no leading
zero). Find and replace all occurrences if it ever changes.
