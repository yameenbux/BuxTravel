# The quote form endpoint, on one.com

The website is static on GitHub Pages and cannot send mail. `quote-handler.php`
is the one piece that runs server-side, and it lives on one.com because the
mailbox does.

## Why here rather than a form service

`bookings@buxtravel.co.uk` is hosted by one.com, so mail sent from one.com is
already coming from an authorised sender for the domain. That removes two
obligations a third-party form service would have added:

| | Form service | This |
|---|---|---|
| SPF / DKIM for a new sender | **Required**, or it lands in spam | Already correct |
| Name a processor in `privacy.html` | **Required** — they handle customer data | No third party involved |
| Monthly cost | Usually, for an autoresponder | None |
| Autoresponder control | Their template system | Our own HTML, read from disk |

one.com routes website mail through `mailout.one.com` automatically for PHP's
`mail()`, so there are no SMTP credentials in this file. The `From` address has
to be a real mailbox on the domain, which `bookings@` is.

**This needs a one.com plan that includes web hosting with PHP**, not just email.
If the plan is email-only, the choice goes back to a form service and the two
obligations above come back with it.

## Deploying

1. Upload three files into the same folder on one.com — the handler reads the
   templates from its own directory, so they must sit beside it:

   ```
   quote-handler.php
   quote-acknowledgement-email.html    (from email/)
   quote-acknowledgement-email.txt     (from email/)
   ```

2. Set the endpoint in `index.html`:

   ```js
   var FORM_ENDPOINT = 'https://buxtravel.co.uk/quote-handler.php';   // wherever you put it
   ```

   The email button is hidden until this is set, so nothing changes on the site
   until you are ready.

3. Send yourself a test enquiry and check it arrives, then check the
   acknowledgement arrives too — **including in Outlook, Gmail and on an
   iPhone.** A browser preview proves nothing about how mail lands.

If you edit the wording of the acknowledgement, re-upload the template. It is
read at send time, so there is one copy of the copy, not two that drift.

## What it does per submission

1. Emails the enquiry to `bookings@`, with `Reply-To` set to the customer so
   hitting reply reaches them, and a subject carrying their name, destination
   and reference.
2. Sends the customer the acknowledgement as a proper multipart message — plain
   text and HTML — because HTML-only mail scores worse with spam filters.

If the acknowledgement fails but the enquiry got through, it still reports
success. The enquiry reaching you is the thing that must not be lost; telling
the customer it failed would send them round again for no reason.

## The security bits, and why they are there

- **CR, LF and null bytes are stripped from every field.** Without that, a
  newline in the name field turns `mail()` into an open relay — the classic
  PHP header-injection hole. There is a test for it.
- **CORS is restricted** to `buxtravel.co.uk` and its `www` form. The browser
  will not let another site POST here.
- **The honeypot answers 200.** A bot that fills the hidden `company` field gets
  a success response and no mail is sent, so it learns nothing from the reply.
- **Two rate limits, deliberately different.** The hourly cap counts every
  attempt, so flooding is capped whether or not payloads are valid. The
  20-second gap applies only to messages actually *sent* — counting it against
  failed attempts would punish someone who mistypes their email, reads the
  error and corrects it ten seconds later.

Rate-limit state is per-IP files in the system temp directory. Fine for a form
this size; it stops someone holding the endpoint open, not a determined
attacker.

## Testing it

`php -l quote-handler.php` for syntax. For the request path, run it against
PHP's built-in server with `sendmail_path` stubbed so `mail()` reports success
without an MTA:

```sh
php -d sendmail_path=/bin/true -S 127.0.0.1:8081 -t .
```

Then exercise it: wrong method, foreign origin, non-JSON, missing fields, bad
email, honeypot, a valid submission, and a second one straight after to prove
the rate limit bites.
