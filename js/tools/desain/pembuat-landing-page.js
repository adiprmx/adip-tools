import { h as T, esc } from '../../core.js';

export const meta = {"id":"pembuat-landing-page","name":"Pembuat Landing Page Satu Halaman","cat":"desain","icon":"🌐","desc":"Rakit landing page satu halaman, ekspor file HTML-nya.","keywords":"landing page,website,html,satu halaman,ekspor","since":"6.19.0"};

const TEMA = [
  ['arang', 'Arang dan Coral', '#161311', '#f6f1e8', '#ff6f61', '#1e1a16'],
  ['terang', 'Terang', '#faf7f2', '#1c1917', '#c2410c', '#ffffff'],
  ['laut', 'Laut Gelap', '#0b1526', '#e8eef7', '#38bdf8', '#12233d'],
];

// HTML mandiri lengkap (fungsi murni, bisa diuji tanpa DOM).
export function buatHtmlLanding(o) {
  const tema = TEMA.find(([v]) => v === (o && o.tema)) || TEMA[0];
  const bg = tema[2], teks = tema[3], aksen = tema[4], kartu = tema[5];
  const brand = esc(o.brand || 'Brandku');
  const judul = esc(o.judul || 'Judul utama di sini');
  const sub = esc(o.subjudul || '');
  const ctaTeks = esc(o.ctaTeks || 'Mulai Sekarang');
  // RED-16 + RED2-02: tolak skema berbahaya di tautan tombol
  // (javascript:/data:/vbscript:) — pratinjau iframe tidak menjalankan
  // skrip, tapi HTML yang diekspor dibuka di browser biasa; tautan
  // javascript: di sana akan jalan saat diklik. NORMALISASI SEBELUM
  // validasi, meniru persis yang dilakukan browser: (1) decode entitas
  // HTML numerik (desimal/heksadesimal, dengan/tanpa titik-koma) dan
  // named yang relevan (&Tab; &NewLine; &colon;) — parser HTML men-decode
  // ini saat membaca nilai atribut; (2) buang tab/LF/CR di mana pun —
  // parser URL WHATWG membuang ketiganya dari URL; (3) buang spasi/
  // kontrol di depan. Output juga di-escape (& -> &amp;) supaya entitas
  // apa pun yang tersisa (mis. hasil decode ganda) tidak bisa di-decode
  // ulang oleh parser HTML. Tautan https: yang sah tidak berubah: esc()
  // hanya menyentuh &<>"' dan browser mengembalikannya saat membaca href.
  const ctaBersih = String(o.ctaLink || '#')
    .replace(/&#x([0-9a-fA-F]+);?/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&#(\d+);?/g, (_, d) => String.fromCharCode(parseInt(d, 10)))
    .replace(/&(tab|newline|colon);/gi, (_, n) => ({ tab: '\t', newline: '\n', colon: ':' }[n.toLowerCase()]))
    .replace(/[\t\n\r]/g, '')
    .trim().replace(/^[\u0000-\u0020]+/, '');
  const ctaLink = /^(javascript|data|vbscript):/i.test(ctaBersih) ? '#' : esc(ctaBersih);
  const fitur = (o.fitur || []).filter((f) => f.judul || f.isi);
  const kaki = esc(o.kaki || '');
  let fiturHtml = '';
  fitur.forEach((f) => {
    fiturHtml += '      <div class="kartu"><h3>' + esc(f.judul) + '</h3><p>' + esc(f.isi) + '</p></div>\n';
  });
  return '<!DOCTYPE html>\n<html lang="id">\n<head>\n<meta charset="utf-8">\n' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
    '<title>' + brand + '</title>\n<style>\n' +
    'body{margin:0;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;background:' + bg + ';color:' + teks + ';line-height:1.6}\n' +
    '.bungkus{max-width:720px;margin:0 auto;padding:48px 20px 64px}\n' +
    '.brand{font-weight:800;font-size:20px;letter-spacing:-0.02em}\n' +
    'h1{font-size:clamp(32px,7vw,52px);line-height:1.1;letter-spacing:-0.03em;margin:40px 0 16px}\n' +
    '.sub{font-size:18px;opacity:.8;margin:0 0 32px}\n' +
    '.tombol{display:inline-block;background:' + aksen + ';color:#fff;text-decoration:none;font-weight:700;padding:14px 28px;border-radius:12px;min-height:44px}\n' +
    '.grid{display:grid;grid-template-columns:1fr;gap:12px;margin-top:48px}\n' +
    '@media(min-width:640px){.grid{grid-template-columns:1fr 1fr}}\n' +
    '.kartu{background:' + kartu + ';border-radius:12px;padding:20px}\n' +
    '.kartu h3{margin:0 0 6px;font-size:17px}\n' +
    '.kartu p{margin:0;opacity:.75;font-size:14px}\n' +
    'footer{margin-top:56px;font-size:13px;opacity:.6}\n' +
    '</style>\n</head>\n<body>\n<div class="bungkus">\n' +
    '  <div class="brand">' + brand + '</div>\n' +
    '  <h1>' + judul + '</h1>\n' +
    (sub ? '  <p class="sub">' + sub + '</p>\n' : '') +
    '  <a class="tombol" href="' + ctaLink + '">' + ctaTeks + '</a>\n' +
    (fiturHtml ? '  <div class="grid">\n' + fiturHtml + '  </div>\n' : '') +
    (kaki ? '  <footer>' + kaki + '</footer>\n' : '') +
    '</div>\n</body>\n</html>\n';
}

export function render(root) {
  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Isi kolomnya, lihat pratinjaunya, lalu unduh file HTML-nya. File yang diunduh mandiri (tanpa file lain) dan bisa langsung diunggah ke hosting statis apa pun.</p>'));

  const brandI = T.input('text', 'Nama brand, contoh: Kopi Pagi');
  const judulI = T.input('text', 'Judul utama, contoh: Kopi susu segar, diantar pagi');
  const subTa = T.ta(2, 'Subjudul singkat, contoh: Biji kopi pilihan, diseduh tiap pagi dan diantar hangat ke rumahmu.');
  const ctaTeksI = T.input('text', 'Teks tombol, contoh: Pesan Sekarang');
  const ctaLinkI = T.input('text', 'Tautan tombol, contoh: wa.me/6281234567890');
  const kakiI = T.input('text', 'Teks kaki halaman (opsional)');
  const temaSel = T.select(TEMA.map(([v, l]) => [v, l]), 'arang');

  root.appendChild(T.field('Nama brand', brandI));
  root.appendChild(T.field('Judul utama', judulI));
  root.appendChild(T.field('Subjudul', subTa));
  root.appendChild(T.grid2(T.field('Teks tombol', ctaTeksI), T.field('Tautan tombol', ctaLinkI)));
  root.appendChild(T.field('Tema warna', temaSel));

  const fiturInput = [];
  for (let i = 0; i < 3; i++) {
    const j = T.input('text', 'Fitur ' + (i + 1) + ' (judul), contoh: Biji segar');
    const isi = T.input('text', 'Fitur ' + (i + 1) + ' (isi), contoh: Disangrai tiap minggu');
    fiturInput.push({ j, isi });
    root.appendChild(T.grid2(T.field('Fitur ' + (i + 1) + ' judul', j), T.field('Fitur ' + (i + 1) + ' isi', isi)));
  }
  root.appendChild(T.field('Teks kaki halaman', kakiI));

  const frame = document.createElement('iframe');
  frame.style.cssText = 'width:100%;height:480px;border:1px solid var(--line);border-radius:12px;margin:12px 0;background:#fff';
  frame.setAttribute('title', 'Pratinjau landing page');
  frame.setAttribute('sandbox', ''); // RED-16: tanpa allow-same-origin — pratinjau tidak butuh akses origin induk
  root.appendChild(T.el('<div class="hint" style="margin-top:8px">Pratinjau:</div>'));
  root.appendChild(frame);

  function kumpulkan() {
    return {
      brand: brandI.value, judul: judulI.value, subjudul: subTa.value,
      ctaTeks: ctaTeksI.value, ctaLink: ctaLinkI.value, tema: temaSel.value, kaki: kakiI.value,
      fitur: fiturInput.map((f) => ({ judul: f.j.value, isi: f.isi.value })),
    };
  }
  function pratinjau() {
    frame.srcdoc = buatHtmlLanding(kumpulkan());
  }
  [brandI, judulI, subTa, ctaTeksI, ctaLinkI, kakiI, temaSel].forEach((el) => el.addEventListener('input', pratinjau));
  temaSel.addEventListener('change', pratinjau);
  fiturInput.forEach((f) => { f.j.addEventListener('input', pratinjau); f.isi.addEventListener('input', pratinjau); });

  const dlB = T.btn('Unduh File HTML', () => {
    T.dl('landing-page.html', buatHtmlLanding(kumpulkan()), 'text/html');
    T.toast('Berhasil diunduh');
  }, true);
  root.appendChild(T.row(dlB, T.copyBtn(() => buatHtmlLanding(kumpulkan()), 'Salin HTML')));
  pratinjau();
}
