/**
 * Halaman HTML cantik untuk link share publik
 * https://catatankuy-backend.vercel.app/api/shares/public/<token>
 *
 * Endpoint yang sama merespon:
 *  - Accept: application/json  -> JSON (dipake aplikasi Flutter)
 *  - browser Chrome/dsb        -> halaman ini (TERINTEGRASI VISUAL, BUKAN JSON)
 *
 * Halaman ini juga coba nge-buka aplikasi Android via intent://
 * (auto setelah 2 detik + tombol), dengan fallback ke link browser.
 */

const APP_PACKAGE = 'com.example.catatankuy_app';
const BASE_URL = (process.env.BASE_URL || 'https://catatankuy-backend.vercel.app').replace(/\/+$/, '');

const esc = (s: unknown): string =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

/** intent:// untuk memicu pembukaan aplikasi CatatanKuy di Android. */
const intentUrl = (token: string): string =>
  `${BASE_URL}/api/shares/public/${encodeURIComponent(token)}#Intent;scheme=https;package=${APP_PACKAGE};S.browser_fallback_url=${encodeURIComponent(
    `${BASE_URL}/api/shares/public/${encodeURIComponent(token)}`
  )};end`;

export function renderSharePage(note: any): string {
  const notFound = !note;

  const intent = notFound ? '' : intentUrl(note.share_token_shown ?? note.share_token ?? '');

  if (notFound) {
    return fullPage(`
      <div class="card">
        <div class="icon err">&#128279;</div>
        <h1>Link tidak bisa dibuka</h1>
        <p>Catatan ini mungkin sudah tidak dibagikan lagi oleh pemiliknya.</p>
        <a class="btn primary" href="${esc(BASE_URL)}">Buka CatatanKuy</a>
      </div>`);
  }

  const title = esc(note.title || 'Tanpa judul');
  const owner = esc(note.owner_name || 'Seseorang');
  const content = esc(note.content || '');
  const imageUrl = note.image_url ? esc(note.image_url) : '';
  // Warna kartu catatan (format #RRGGBB dari aplikasi); fallback ungu CatatanKuy
  const cardColor = /^#[0-9A-Fa-f]{3,8}$/.test(String(note.color || '')) ? esc(note.color) : '#FFF9C4';

  return fullPage(`
    <div class="card" id="note">
      ${imageUrl ? `<img class="photo" src="${imageUrl}" alt="Foto catatan">` : ''}
      <div class="card-body" style="background:${cardColor}">
        <h1>${title}</h1>
        <p class="owner">Oleh ${owner}</p>
        ${content ? `<p class="content">${content.replace(/\\n/g, '<br>')}</p>` : ''}
      </div>
    </div>
    <a class="btn primary" href="${esc(intent)}">Buka di aplikasi CatatanKuy</a>
    <p class="hint">Otomatis membuka aplikasi Android beberapa detik lagi. Kalau belum terpasang, lakukan <a href="${esc(BASE_URL)}">install CatatanKuy</a> terlebih dahulu.</p>
    <script>
      // Coba buka aplikasi otomatis (intent:// di-filter Chrome Android)
      setTimeout(function () {
        var w = window.open('${esc(intent).replace(/'/g, "\\'")}', '_self');
        if (w) try { w.close(); } catch (e) {}
      }, 2000);
    </script>`);
}

function fullPage(body: string): string {
  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#6C4DFF">
  <title>CatatanKuy - Catatan Dibagikan</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
      background: linear-gradient(135deg, #5B3FE0, #9B5CFF);
      min-height: 100vh; display: flex; flex-direction: column;
      align-items: center; padding: 28px 16px 40px;
    }
    .brand { color: #fff; font-weight: 800; font-size: 18px; margin-bottom: 18px;
             display: flex; gap: 8px; align-items: center; }
    .brand .logo { background: #fff; color: #6C4DFF; border-radius: 10px;
                   padding: 4px 8px; font-size: 16px; }
    .card {
      background: #fff; border-radius: 20px; max-width: 480px; width: 100%;
      overflow: hidden; box-shadow: 0 12px 40px rgba(0,0,0,.25); margin-bottom: 18px;
    }
    .photo { width: 100%; display: block; aspect-ratio: 1/1; object-fit: cover; }
    .card-body { padding: 20px; }
    .card-body h1 { color: #1E1B2E; font-size: 20px; word-break: break-word; }
    .owner { color: #00000099; font-size: 13px; margin-top: 4px; }
    .content { color: #1E1B2EC0; font-size: 15px; line-height: 1.6;
               margin-top: 12px; white-space: pre-wrap; word-break: break-word; }
    .btn.primary {
      background: #fff; color: #6C4DFF; font-weight: 800; text-decoration: none;
      padding: 14px 22px; border-radius: 16px; font-size: 15px;
      box-shadow: 0 8px 24px rgba(0,0,0,.18); display: inline-block; margin-top: 4px;
    }
    .icon { font-size: 40px; margin-bottom: 10px; }
    .icon.err::after { content: ''; }
    h1 { font-size: 20px; }
    .card p { color: #1E1B2EB0; font-size: 14px; line-height: 1.5; }
    .hint { color: rgba(255,255,255,.85); font-size: 12px; max-width: 420px;
            text-align: center; margin-top: 14px; line-height: 1.5; }
    .hint a { color: #fff; }
    @media (min-width: 600px) { body { padding-top: 60px; } }
  </style>
</head>
<body>
  <div class="brand"><span class="logo">&#128208;</span> CatatanKuy</div>
  ${body}
</body>
</html>`;
}
