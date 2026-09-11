<?php
/* ======================================================================
   Quote form handler — one.com hosting.

   The website is static on GitHub Pages and cannot send mail. This is
   the one piece that runs server-side. It lives on one.com because the
   mailbox does: mail sent from here comes from an authorised sender for
   buxtravel.co.uk, so SPF and DKIM are already correct and there is no
   third-party processor to name in the privacy policy.

   It does two things per submission:
     1. Emails the enquiry to bookings@, with Reply-To set to the
        customer so hitting reply reaches them.
     2. Sends the customer the acknowledgement, using the same template
        that lives in email/ — read from disk, not duplicated here.

   DEPLOY: upload this file and quote-acknowledgement-email.{html,txt}
   into the same folder on one.com, then set FORM_ENDPOINT in index.html
   to the resulting URL. See README.md in this folder.
   ====================================================================== */

declare(strict_types=1);

const MAIL_TO       = 'bookings@buxtravel.co.uk';
const MAIL_FROM     = 'bookings@buxtravel.co.uk';  // must be a real mailbox on the domain
const BUSINESS_NAME = 'Bux Travel';
const RATE_SECONDS  = 20;    // minimum gap between submissions from one address
const RATE_PER_HOUR = 12;

/* Only our own pages may call this. The site is on a different origin to
   this script, so the browser sends a preflight and will refuse the POST
   without these. */
$allowed = ['https://www.buxtravel.co.uk', 'https://buxtravel.co.uk'];
$origin  = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowed, true)) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Vary: Origin');
}
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') { http_response_code(204); exit; }

function fail(int $code, string $msg): never {
    http_response_code($code);
    echo json_encode(['ok' => false, 'error' => $msg]);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') fail(405, 'Method not allowed');
if ($origin !== '' && !in_array($origin, $allowed, true)) fail(403, 'Origin not allowed');

$raw = file_get_contents('php://input');
if ($raw === false || strlen($raw) > 20000) fail(413, 'Payload too large');
$in = json_decode($raw, true);
if (!is_array($in)) fail(400, 'Expected JSON');

/* Honeypot. The form has a hidden field bots fill and people never see.
   Answer 200 so a bot learns nothing from the response. */
if (trim((string)($in['company'] ?? '')) !== '') { echo json_encode(['ok' => true]); exit; }

/* --- rate limit -----------------------------------------------------
   Crude and file-based, which is all a form this size needs. It stops
   someone holding the endpoint open, not a determined attacker.

   Two limits, deliberately different:

     - the hourly cap counts EVERY attempt, so flooding is capped
       whether or not the payloads are valid;
     - the short gap applies only to messages actually SENT.

   That split matters. Counting the gap against failed attempts punishes
   the person who mistypes their email, reads the error and corrects it
   ten seconds later — they would be told "too many requests" for doing
   exactly what the error asked. */
$ip   = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
$dir  = sys_get_temp_dir() . '/bux-quote-rate';
@mkdir($dir, 0700, true);
$file = $dir . '/' . hash('sha256', $ip);
$now  = time();

$attempts = [];
$lastSent = 0;
if (is_file($file)) {
    $saved    = explode("\n", (string)file_get_contents($file));
    $attempts = array_filter(array_map('intval', explode(',', $saved[0] ?? '')));
    $lastSent = (int)($saved[1] ?? 0);
}
$attempts = array_values(array_filter($attempts, fn($t) => $t > $now - 3600));

if (count($attempts) >= RATE_PER_HOUR)            fail(429, 'Too many requests');
if ($lastSent && $now - $lastSent < RATE_SECONDS) fail(429, 'Too many requests');

$attempts[] = $now;
$remember = function (bool $sent) use ($file, $attempts, $lastSent, $now): void {
    @file_put_contents($file, implode(',', $attempts) . "\n" . ($sent ? $now : $lastSent), LOCK_EX);
};
$remember(false);

/* --- read and clean the fields --------------------------------------
   CR and LF are stripped from everything that could reach a mail
   header. Without that, a newline in a field turns this into an open
   relay — the classic header-injection hole in PHP mail(). */
function field(array $in, string $key, int $max = 400): string {
    $v = is_scalar($in[$key] ?? null) ? (string)$in[$key] : '';
    $v = str_replace(["\r", "\n", "\0"], ' ', $v);
    $v = trim(preg_replace('/\s+/u', ' ', $v) ?? '');
    return mb_substr($v, 0, $max);
}

$d = [
    'ref'        => field($in, 'ref', 40),
    'name'       => field($in, 'name', 120),
    'firstName'  => field($in, 'firstName', 60),
    'phone'      => field($in, 'phone', 40),
    'email'      => field($in, 'email', 160),
    'pickup'     => field($in, 'pickup'),
    'dropoff'    => field($in, 'dropoff'),
    'date'       => field($in, 'date', 60),
    'time'       => field($in, 'time', 20),
    'passengers' => field($in, 'passengers', 10),
    'journey'    => field($in, 'journey', 80),
    'notes'      => mb_substr(trim((string)($in['notes'] ?? '')), 0, 2000),
    'route'      => field($in, 'route', 20) === 'whatsapp' ? 'whatsapp' : 'email',
];

foreach (['name', 'phone', 'pickup', 'dropoff', 'date', 'time', 'passengers', 'journey'] as $k) {
    if ($d[$k] === '') fail(422, 'Missing field: ' . $k);
}
if (!filter_var($d['email'], FILTER_VALIDATE_EMAIL)) fail(422, 'Invalid email');
if ($d['ref'] === '') $d['ref'] = 'BX-Q-' . date('dm') . random_int(1000, 9999);
if ($d['firstName'] === '') $d['firstName'] = explode(' ', $d['name'])[0];
if ($d['notes'] === '') $d['notes'] = '—';

/* --- send ------------------------------------------------------------
   one.com routes website mail through mailout.one.com automatically for
   PHP mail(); no SMTP credentials are needed here. The From address has
   to be a real mailbox on the domain, which MAIL_FROM is. */
function headers_for(string $fromName, string $from, string $replyTo, string $boundary = ''): string {
    $h = [
        'From: ' . mb_encode_mimeheader($fromName) . ' <' . $from . '>',
        'Reply-To: ' . $replyTo,
        'MIME-Version: 1.0',
        'X-Mailer: buxtravel-quote-handler',
    ];
    $h[] = $boundary
        ? 'Content-Type: multipart/alternative; boundary="' . $boundary . '"'
        : 'Content-Type: text/plain; charset=UTF-8';
    return implode("\r\n", $h);
}

/* 1. the enquiry, to us */
$lines = [
    'Ref:        ' . $d['ref'],
    'Route:      ' . ($d['route'] === 'whatsapp' ? 'WhatsApp button' : 'Email button'),
    '',
    'Name:       ' . $d['name'],
    'Phone:      ' . $d['phone'],
    'Email:      ' . $d['email'],
    'Pick-up:    ' . $d['pickup'],
    'Going to:   ' . $d['dropoff'],
    'Date:       ' . $d['date'] . ' at ' . $d['time'],
    'Passengers: ' . $d['passengers'],
    'Journey:    ' . $d['journey'],
    '',
    'Notes:',
    $d['notes'],
];
$subject = sprintf('Quote request — %s, %s (%s)', $d['name'], $d['dropoff'], $d['ref']);
$sentInternal = mail(
    MAIL_TO,
    mb_encode_mimeheader($subject),
    implode("\r\n", $lines),
    headers_for(BUSINESS_NAME . ' website', MAIL_FROM, $d['email']),
    '-f' . MAIL_FROM
);

/* 2. the acknowledgement, to them. Templates are read from disk so
      there is one copy of the wording, not two that drift. */
function render(string $file, array $d, bool $escape): string {
    $tpl = @file_get_contents(__DIR__ . '/' . $file);
    if ($tpl === false) return '';
    foreach ($d as $k => $v) {
        $tpl = str_replace('{{' . $k . '}}',
            $escape ? htmlspecialchars($v, ENT_QUOTES, 'UTF-8') : $v, $tpl);
    }
    return $tpl;
}

$html = render('quote-acknowledgement-email.html', $d, true);
$text = render('quote-acknowledgement-email.txt',  $d, false);
if ($text !== '') {
    /* the .txt carries a short explanatory preamble for whoever edits it */
    $cut  = strpos($text, "-----\n");
    $text = $cut === false ? $text : substr($text, strpos($text, "\n", $cut) + 1);
}

$sentAck = false;
if ($html !== '' || $text !== '') {
    $b   = '=_bux_' . bin2hex(random_bytes(12));
    $eol = "\r\n";
    $body = '--' . $b . $eol
          . 'Content-Type: text/plain; charset=UTF-8' . $eol
          . 'Content-Transfer-Encoding: 8bit' . $eol . $eol
          . ($text !== '' ? $text : strip_tags($html)) . $eol . $eol
          . '--' . $b . $eol
          . 'Content-Type: text/html; charset=UTF-8' . $eol
          . 'Content-Transfer-Encoding: 8bit' . $eol . $eol
          . $html . $eol . $eol
          . '--' . $b . '--';

    $sentAck = mail(
        $d['name'] . ' <' . $d['email'] . '>',
        mb_encode_mimeheader('Got your request — fixed price coming shortly (' . $d['ref'] . ')'),
        $body,
        headers_for(BUSINESS_NAME, MAIL_FROM, MAIL_FROM, $b),
        '-f' . MAIL_FROM
    );
}

/* The enquiry reaching us is what must not be lost. If only the
   acknowledgement failed, still report success: the customer's enquiry
   is safe, and telling them otherwise would send them round again. */
if (!$sentInternal) fail(502, 'Could not send');
$remember(true);   // only a real send starts the short gap
echo json_encode(['ok' => true, 'ref' => $d['ref'], 'acknowledged' => $sentAck]);
