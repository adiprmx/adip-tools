import { h as T, kv, utils, errBox, esc, preHtml } from '../../core.js?v=6.12.0';

/* Batas karakter yang dipakai Google sebagai acuan umum. */
export const TITLE_IDEAL = [50, 60];
export const DESC_IDEAL = [150, 160];

export function nilaiPanjang(n, ideal) {
  if (n === 0) return { st: 'kosong', label: 'Belum diisi' };
  if (n < ideal[0]) return { st: 'pendek', label: 'Kependekan, masih bisa ditambah' };
  if (n <= ideal[1]) return { st: 'pas', label: 'Pas' };
  return { st: 'panjang', label: 'Kepanjangan, Google bisa memotongnya' };
}

export function potong(s, max) {
  s = String(s == null ? '' : s);
  return s.length > max ? s.slice(0, max - 1).trimEnd() + '…' : s;
}

export const meta = {"id": "meta-generator", "name": "Meta Tag Generator", "cat": "developer", "icon": "🏷️", "desc": "Generator meta tag SEO + pratinjau Google (desktop & HP) dan kartu X.", "keywords": "meta,seo,tag,website,serp,twitter card,og"};
export function render(root) {

    const fTitle = T.input('text', 'Judul halaman', '');
    const fDesc = T.ta(2, 'Deskripsi singkat halaman (150-160 karakter ideal)');
    const fKeys = T.input('text', 'kata kunci, dipisah koma', '');
    const fAuthor = T.input('text', 'Nama penulis/situs', '');
    const fUrl = T.input('text', 'https://situsmu.com/halaman', '');
    const fOgT = T.input('text', 'og:title (kosongkan = pakai title)', '');
    const fOgD = T.ta(2, 'og:description (kosongkan = pakai description)');
    const fOgI = T.input('text', 'URL gambar og:image (https://…)', '');
    const fTw = T.select([['summary_large_image', 'Kartu besar (gambar)'], ['summary', 'Kartu ringkas']], 'summary_large_image');
    const fTwUser = T.input('text', '@akunmu (opsional)', '');
    const box = T.out();
    const cntTitle = T.el('<div class="hint"></div>');
    const cntDesc = T.el('<div class="hint"></div>');
    const serpBox = T.el('<div style="margin:12px 0"></div>');
    const twBox = T.el('<div style="margin:12px 0"></div>');
    let serpMode = 'desktop';
    const serpToggle = T.el('<div style="display:flex;gap:8px;margin:12px 0 4px"></div>');
    const bDesktop = T.btn('Pratinjau: Desktop', () => { serpMode = 'desktop'; paintSerp(); });
    const bMobile = T.btn('Pratinjau: HP', () => { serpMode = 'mobile'; paintSerp(); });
    bDesktop.classList.add('primary');
    serpToggle.appendChild(bDesktop);
    serpToggle.appendChild(bMobile);

    const warnaStatus = (st) => (st === 'pas' ? '#4ade80' : st === 'kosong' ? '#a1a1aa' : st === 'pendek' ? '#fbbf24' : '#f87171');

    const domainTampil = (url) => {
      const u = String(url || '').trim();
      if (!u) return 'contoh.com › halaman';
      const bersih = u.replace(/^https?:\/\//, '').replace(/\/$/, '');
      const bagi = bersih.split('/');
      return bagi.length > 1 ? bagi[0] + ' › ' + bagi.slice(1, 3).join(' › ') : bersih;
    };

    const paintSerp = () => {
      const title = fTitle.value.trim(), desc = fDesc.value.trim();
      const nt = nilaiPanjang(title.length, TITLE_IDEAL);
      const nd = nilaiPanjang(desc.length, DESC_IDEAL);
      cntTitle.innerHTML = '<span style="color:' + warnaStatus(nt.st) + '">' + T.fmt(title.length) + ' karakter · ' + esc(nt.label) + ' (ideal 50-60)</span>';
      cntDesc.innerHTML = '<span style="color:' + warnaStatus(nd.st) + '">' + T.fmt(desc.length) + ' karakter · ' + esc(nd.label) + ' (ideal 150-160)</span>';
      bDesktop.classList.toggle('primary', serpMode === 'desktop');
      bMobile.classList.toggle('primary', serpMode === 'mobile');
      const hp = serpMode === 'mobile';
      if (!title && !desc) {
        serpBox.innerHTML = '<div class="hint">Pratinjau hasil pencarian muncul di sini setelah judul atau deskripsi diisi.</div>';
      } else {
        serpBox.innerHTML =
          '<div class="hint" style="margin-bottom:6px">Pratinjau hasil Google ' + (hp ? '(HP)' : '(desktop)') + ' (perkiraan):</div>' +
          '<div style="background:#fff;border-radius:8px;padding:' + (hp ? '12px' : '14px 16px') + ';max-width:' + (hp ? '360px' : '600px') + '">' +
          '<div style="font-size:12px;color:#006621;margin-bottom:2px">' + esc(domainTampil(fUrl.value)) + '</div>' +
          '<div style="font-size:' + (hp ? '16px' : '18px') + ';line-height:1.3;color:#1a0dab">' + esc(potong(title || '(judul belum diisi)', hp ? 50 : 60)) + '</div>' +
          '<div style="font-size:13px;line-height:1.5;color:#545454;margin-top:3px">' + esc(potong(desc || '(deskripsi belum diisi)', hp ? 130 : 160)) + '</div></div>' +
          (hp ? '<div class="hint" style="margin-top:6px">Di HP, Google memotong judul &amp; deskripsi lebih pendek dari desktop.</div>' : '');
      }
      const ogT = fOgT.value.trim() || title, ogD = fOgD.value.trim() || desc, ogI = fOgI.value.trim();
      const besar = fTw.value === 'summary_large_image';
      if (!ogT && !ogD) {
        twBox.innerHTML = '<div class="hint">Pratinjau kartu X muncul di sini setelah judul atau deskripsi diisi.</div>';
      } else {
        const imgHtml = ogI
          ? '<img src="' + esc(ogI) + '" style="' + (besar ? 'width:100%;height:180px;object-fit:cover;display:block' : 'width:120px;height:120px;object-fit:cover;flex-shrink:0') + '" alt="" onerror="this.style.display=\'none\'">'
          : '<div style="' + (besar ? 'width:100%;height:120px' : 'width:120px;height:120px;flex-shrink:0') + ';background:#16181c;display:flex;align-items:center;justify-content:center;color:#71767b;font-size:12px">tanpa gambar</div>';
        const bodyHtml = '<div style="padding:10px 12px"><div style="font-size:14px;color:#e7e9ea">' + esc(ogT || '(tanpa judul)') + '</div>' +
          '<div style="font-size:13px;color:#71767b;margin-top:2px;overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical">' + esc(ogD || '(tanpa deskripsi)') + '</div>' +
          '<div class="hint" style="margin-top:4px;color:#71767b">' + esc(domainTampil(fUrl.value).split(' › ')[0]) + '</div></div>';
        twBox.innerHTML =
          '<div class="hint" style="margin-bottom:6px">Pratinjau kartu X / Twitter:</div>' +
          '<div style="border-radius:12px;overflow:hidden;max-width:420px;border:1px solid #2f3336;background:#000;' + (besar ? '' : 'display:flex') + '">' + imgHtml + bodyHtml + '</div>' +
          (besar && !ogI ? '<div class="hint" style="margin-top:6px;color:#fbbf24">Kartu besar dipilih tapi gambar belum diisi. Isi og:image supaya kartu tampil dengan gambar.</div>' : '');
      }
    };

    const build = () => {
      const title = fTitle.value.trim(), desc = fDesc.value.trim(), keys = fKeys.value.trim(),
        author = fAuthor.value.trim(), ogT = fOgT.value.trim() || title, ogD = fOgD.value.trim() || desc,
        ogI = fOgI.value.trim(), twUser = fTwUser.value.trim().replace(/^@/, ''),
        url = fUrl.value.trim();
      if (!title) return '';
      const L = ['<title>' + esc(title) + '</title>'];
      if (desc) L.push('<meta name="description" content="' + esc(desc) + '">');
      if (keys) L.push('<meta name="keywords" content="' + esc(keys) + '">');
      if (author) L.push('<meta name="author" content="' + esc(author) + '">');
      if (url) L.push('<link rel="canonical" href="' + esc(url) + '">');
      L.push('<meta property="og:type" content="website">');
      if (ogT) L.push('<meta property="og:title" content="' + esc(ogT) + '">');
      if (ogD) L.push('<meta property="og:description" content="' + esc(ogD) + '">');
      if (url) L.push('<meta property="og:url" content="' + esc(url) + '">');
      if (ogI) L.push('<meta property="og:image" content="' + esc(ogI) + '">');
      L.push('<meta name="twitter:card" content="' + fTw.value + '">');
      if (twUser) {
        L.push('<meta name="twitter:site" content="@' + esc(twUser) + '">');
        L.push('<meta name="twitter:creator" content="@' + esc(twUser) + '">');
      }
      if (ogT) L.push('<meta name="twitter:title" content="' + esc(ogT) + '">');
      if (ogD) L.push('<meta name="twitter:description" content="' + esc(ogD) + '">');
      if (ogI) L.push('<meta name="twitter:image" content="' + esc(ogI) + '">');
      return L.join('\n');
    };
    [fTitle, fDesc, fOgT, fOgD, fOgI, fTw, fUrl].forEach((i) => i.addEventListener('input', paintSerp));
    fTw.addEventListener('change', paintSerp);
    root.appendChild(T.field('Title', fTitle));
    root.appendChild(cntTitle);
    root.appendChild(T.field('Author', fAuthor));
    root.appendChild(T.field('Description', fDesc));
    root.appendChild(cntDesc);
    root.appendChild(T.field('Keywords', fKeys));
    root.appendChild(T.field('URL halaman', fUrl, 'Dipakai untuk pratinjau alamat di Google, tag og:url, dan link canonical.'));
    root.appendChild(T.grid2(T.field('og:title', fOgT), T.field('og:image', fOgI)));
    root.appendChild(T.field('og:description', fOgD));
    root.appendChild(T.grid2(T.field('Twitter card', fTw), T.field('Akun X (opsional)', fTwUser, 'Untuk tag twitter:site dan twitter:creator.')));
    root.appendChild(serpToggle);
    root.appendChild(serpBox);
    root.appendChild(twBox);
    root.appendChild(T.row(T.btn('Generate', () => {
      const c = build();
      if (!c) { T.show(box, errBox('Isi dulu minimal Title.')); return; }
      T.show(box, preHtml(c));
    }, true), T.copyBtn(() => { const c = build(); return c || ''; }, 'Salin')));
    root.appendChild(box);
    paintSerp();
  
}
