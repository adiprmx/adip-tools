import { h as T, kv, utils, esc, tabs } from '../../core.js?v=6.11.5';

/* Fungsi murni (bisa diuji dari node tanpa DOM). */
export function parseOgTags(html) {
  const out = {};
  const re = /<meta\s+[^>]*?(?:property|name)\s*=\s*["']([^"']+)["'][^>]*?content\s*=\s*["']([^"']*)["'][^>]*>/gi;
  const re2 = /<meta\s+[^>]*?content\s*=\s*["']([^"']*)["'][^>]*?(?:property|name)\s*=\s*["']([^"']+)["'][^>]*>/gi;
  let m;
  while ((m = re.exec(html))) out[m[1].toLowerCase()] = m[2];
  while ((m = re2.exec(html))) out[m[2].toLowerCase()] = m[1];
  const title = /<title[^>]*>([^<]*)<\/title>/i.exec(html);
  if (title && !out['og:title']) out['og:title'] = title[1].trim();
  return out;
}

export function cekTag(tags) {
  const perlu = [
    ['og:title', 'Judul (og:title)'],
    ['og:description', 'Deskripsi (og:description)'],
    ['og:image', 'Gambar (og:image)'],
    ['og:url', 'Alamat halaman (og:url)'],
    ['twitter:card', 'Kartu X (twitter:card)'],
  ];
  return perlu.map(([k, label]) => ({ key: k, label, ada: Boolean(tags[k] && String(tags[k]).trim()), nilai: tags[k] || '' }));
}

export const meta = {"id": "og-preview", "name": "Open Graph Preview", "cat": "developer", "icon": "👁️", "desc": "Preview tampilan link di medsos.", "keywords": "og,preview,link,sosmed,medsos"};
export function render(root) {

    const fT = T.input('text', 'Judul link', 'Judul Artikel yang Menarik');
    const fD = T.ta(2, 'Deskripsi singkat…', 'Deskripsi singkat yang bikin orang penasaran dan pengin klik.');
    const fU = T.input('text', 'https://contoh.com/artikel', 'https://contoh.com');
    const fImg = T.input('text', 'URL gambar (https://…), atau upload di bawah', '');
    const fFile = T.el('<input type="file" accept="image/*" class="inp">');
    const fPaste = T.ta(4, 'Tempel tag <meta> dari situsmu di sini, misal:\n<meta property="og:title" content="Judul">\n<meta property="og:image" content="https://…">');
    const cekBox = T.out();
    const waBox = T.el('<div></div>'), tgBox = T.el('<div></div>'), fbBox = T.el('<div></div>'), liBox = T.el('<div></div>'), xBox = T.el('<div></div>');
    let imgData = '';
    let imgStatus = '';
    fFile.addEventListener('change', () => {
      const f = fFile.files && fFile.files[0];
      if (!f) return;
      const rd = new FileReader();
      rd.onload = () => { imgData = String(rd.result); imgStatus = ''; paint(); };
      rd.readAsDataURL(f);
    });
    const cardShell = 'border-radius:12px;overflow:hidden;max-width:420px;margin-bottom:16px;border:1px solid #27272a';
    function paint() {
      const t = fT.value.trim() || '(tanpa judul)', d = fD.value.trim() || '(tanpa deskripsi)',
        u = fU.value.trim().replace(/^https?:\/\//, '') || 'contoh.com',
        img = imgData || fImg.value.trim();
      const imgHtml = img
        ? '<img src="' + esc(img) + '" style="width:100%;height:200px;object-fit:cover;display:block" alt="">'
        : '<div style="width:100%;height:200px;background:linear-gradient(135deg,#3f3f46,#18181b);display:flex;align-items:center;justify-content:center;color:#71717a;font-size:13px">tidak ada gambar</div>';
      waBox.innerHTML =
        '<div style="' + cardShell + ';background:#0b141a">' +
        imgHtml +
        '<div style="padding:10px 12px;background:#1f2c34"><div style="font-size:13px;color:#fff">' + esc(t) + '</div>' +
        '<div style="font-size:12px;color:#8696a0;margin-top:2px;overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical">' + esc(d) + '</div>' +
        '<div class="hint" style="margin-top:4px;color:#8696a0">' + esc(u) + '</div></div></div>';
      tgBox.innerHTML =
        '<div style="' + cardShell + ';background:#17212b;padding:12px">' +
        '<div style="border-left:2px solid #5288c1;padding-left:10px">' +
        '<div style="font-size:13px;color:#6ab2f2;font-weight:600">' + esc(u) + '</div>' +
        (img ? '<img src="' + esc(img) + '" style="width:100%;height:160px;object-fit:cover;border-radius:8px;margin:8px 0" alt="">' : '') +
        '<div style="font-size:13px;color:#fff;font-weight:600">' + esc(t) + '</div>' +
        '<div style="font-size:13px;color:#7f91a4;margin-top:2px;overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical">' + esc(d) + '</div>' +
        '</div></div>';
      fbBox.innerHTML =
        '<div style="' + cardShell + ';background:#fff;border-color:#ddd">' +
        imgHtml +
        '<div style="padding:10px 12px;background:#f0f2f5"><div style="font-size:12px;color:#65676b;text-transform:uppercase">' + esc(u) + '</div>' +
        '<div style="font-size:16px;color:#050505;font-weight:600;margin-top:2px">' + esc(t) + '</div>' +
        '<div style="font-size:13px;color:#65676b;margin-top:2px;overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical">' + esc(d) + '</div></div></div>';
      liBox.innerHTML =
        '<div style="' + cardShell + ';background:#fff;border-color:#ddd">' +
        imgHtml +
        '<div style="padding:10px 12px"><div style="font-size:14px;color:#191919;font-weight:600">' + esc(t) + '</div>' +
        '<div style="font-size:12px;color:#666;margin-top:2px">' + esc(u) + '</div>' +
        '<div style="font-size:12px;color:#666;margin-top:2px;overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical">' + esc(d) + '</div></div></div>';
      xBox.innerHTML =
        '<div style="' + cardShell + ';background:#000">' +
        imgHtml +
        '<div style="padding:10px 12px;border-top:1px solid #2f3336"><div class="hint" style="color:#71767b">' + esc(u) + '</div>' +
        '<div style="font-size:14px;color:#e7e9ea;margin-top:2px">' + esc(t) + '</div>' +
        '<div style="font-size:13px;color:#71767b;margin-top:2px;overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical">' + esc(d) + '</div></div></div>';
    }
    [fT, fD, fU, fImg].forEach((i) => i.addEventListener('input', paint));
    root.appendChild(T.field('og:title', fT));
    root.appendChild(T.field('og:description', fD));
    root.appendChild(T.field('URL', fU));
    root.appendChild(T.field('og:image (URL)', fImg));
    root.appendChild(T.field('atau upload gambar lokal', fFile, 'Gambar tidak diupload ke mana-mana, hanya dibaca di HP kamu.'));
    root.appendChild(T.field('Atau tempel tag dari situsmu', fPaste, 'Tag yang ditempel dipakai untuk mengisi kolom di atas sekaligus diperiksa kelengkapannya.'));
    root.appendChild(T.row(T.btn('Isi dari Tag & Periksa', () => {
      const tags = parseOgTags(fPaste.value);
      const hasil = cekTag(tags);
      if (tags['og:title']) fT.value = tags['og:title'];
      if (tags['og:description']) fD.value = tags['og:description'];
      if (tags['og:url']) fU.value = tags['og:url'];
      if (tags['og:image']) { fImg.value = tags['og:image']; imgData = ''; }
      if (!hasil.some((h) => h.ada)) {
        T.show(cekBox, '<span class="err">Tidak ada tag Open Graph yang dikenali. Pastikan yang ditempel berisi tag &lt;meta property="og:…"&gt;.</span>');
        paint();
        return;
      }
      let html = hasil.map((h) => '<div style="font-size:13px;line-height:1.7"><span style="color:' + (h.ada ? '#4ade80' : '#f87171') + '">' + (h.ada ? '✓' : '✗') + '</span> ' + esc(h.label) + (h.ada ? ' <span class="hint">: ' + esc(String(h.nilai).slice(0, 60)) + (String(h.nilai).length > 60 ? '…' : '') + '</span>' : ' <span class="hint">(belum ada, sebaiknya ditambahkan)</span>') + '</div>').join('');
      const imgUrl = tags['og:image'];
      if (imgUrl) {
        html += '<div id="og-img-cek" style="font-size:13px;line-height:1.7;color:#a1a1aa">Memeriksa gambar…</div>';
        T.show(cekBox, html);
        const probe = new Image();
        probe.onload = () => { const n = document.getElementById('og-img-cek'); if (n) { n.innerHTML = '<span style="color:#4ade80">✓</span> Gambar bisa dibuka (' + probe.naturalWidth + ' × ' + probe.naturalHeight + ' px)'; } };
        probe.onerror = () => { const n = document.getElementById('og-img-cek'); if (n) { n.innerHTML = '<span style="color:#f87171">✗</span> Gambar tidak bisa dibuka. Periksa lagi URL gambarnya.'; } };
        probe.src = imgUrl;
      } else {
        T.show(cekBox, html);
      }
      paint();
    }, true)));
    root.appendChild(cekBox);
    root.appendChild(T.el('<div class="hint" style="margin:12px 0 8px">Pratinjau tampilan link di tiap aplikasi:</div>'));
    root.appendChild(tabs([['WhatsApp', 0], ['Telegram', 1], ['Facebook', 2], ['LinkedIn', 3], ['X', 4]], [waBox, tgBox, fbBox, liBox, xBox]));
    root.appendChild(waBox);
    root.appendChild(tgBox);
    root.appendChild(fbBox);
    root.appendChild(liBox);
    root.appendChild(xBox);
    paint();
  
}
