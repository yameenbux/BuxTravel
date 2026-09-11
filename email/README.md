# Email templates

## `enquiry-acknowledgement`

Sent automatically the moment someone submits the quote form by email.
`.html` and `.txt` are the two halves of one message — set both, because a
spam filter scores an HTML-only email worse and some people read mail as text.

**It acknowledges an enquiry. It does not confirm a booking.** At that moment no
price has been agreed and nothing has been booked, so it says so explicitly. A
booking confirmation is a different email, sent by hand once the job is actually
agreed. Do not repurpose this one for that — promising a confirmation you have
not made is the kind of thing that turns into an argument on the day.

### Merge tags

The placeholders use the same names as the JSON the form posts, so the payload
keys and the template tags are one list:

```
{{name}} {{pickup}} {{dropoff}} {{date}} {{time}} {{passengers}} {{journey}} {{notes}}
```

The form also posts `phone` and `email`, which this template does not display —
the recipient already knows their own. Add them if you want them echoed back.

Most providers use the double-brace form. Some use `%field%` or `*|FIELD|*`.
Check yours: a placeholder that does not match arrives as literal text in front
of a customer.

### Why the HTML looks like 2005

Because email clients are. Outlook renders with Microsoft Word's engine and
supports none of the CSS a web page uses. So: tables for layout, styles inline
on every element, a fixed 600px width, no flexbox, no grid, no custom
properties, no web fonts, and VML fallbacks so the buttons survive Outlook.

If you edit it, keep to that. A template built like a web page looks immaculate
in a browser and arrives as a column of unstyled text. **Send yourself a test to
Outlook, Gmail and an iPhone before you rely on it** — a browser preview proves
nothing about how it lands.

Two other deliberate choices:

- **No images.** Most clients block them by default, so the masthead is drawn in
  type and table cells. A logo nobody sees is not a masthead.
- **No unsubscribe link.** This is a reply to someone's own enquiry, so it is
  transactional rather than marketing. Do not send anything promotional to these
  addresses without a lawful basis and an unsubscribe.

### Before switching the autoresponder on

1. **Check your provider actually does autoresponders**, and on which tier. They
   are frequently a paid feature.
2. **Name the provider in section 6 of `privacy.html`**, "Who we share your
   information with". It becomes a processor handling customer names, numbers
   and email addresses on your behalf.
3. **Add its SPF and DKIM records to `buxtravel.co.uk`.** Without them this lands
   in spam, and a customer who never sees the acknowledgement concludes you
   never replied — worse than sending nothing.

### Suggested subject line

> Got your enquiry — price coming shortly

Avoid "confirmation" in the subject. It sets the wrong expectation before the
message has been opened.
