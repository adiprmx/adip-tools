import { h as T, kv, utils, errBox, esc, preHtml } from '../../core.js';

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

/* Google memotong judul & deskripsi berdasarkan LEBAR PIXEL, bukan jumlah huruf.
   Acuan umum: judul desktop ~600px (font Arial 20px), HP ~350px; deskripsi
   desktop ~2 baris. Pengukuran memakai canvas agar potongannya mirip aslinya.
   (Dari Simulator Hasil Pencarian Google.) */
export const JUDUL_PX_DESKTOP = 600;
export const JUDUL_PX_MOBILE = 350;
export const DESK_PX_DESKTOP = 600;
export const DESK_PX_MOBILE = 350;

let _ctx = null;
function lebarTeks(teks, font) {
  if (typeof document === 'undefined') return teks.length * 9;
  if (!_ctx) {
    const c = document.createElement('canvas');
    _ctx = c.getContext('2d');
  }
  if (!_ctx) return teks.length * 9;
  _ctx.font = font;
  return _ctx.measureText(teks).width;
}

/* Potong teks supaya muat dalam lebar pixel, tambah "…" bila terpotong. */
export function potongPixel(teks, maksPx, font) {
  const t = String(teks || '');
  if (lebarTeks(t, font) <= maksPx) return { tampil: t, terpotong: false };
  let rendah = 0, tinggi = t.length, pas = 0;
  while (rendah <= tinggi) {
    const tengah = Math.floor((rendah + tinggi) / 2);
    if (lebarTeks(t.slice(0, tengah) + '…', font) <= maksPx) { pas = tengah; rendah = tengah + 1; }
    else tinggi = tengah - 1;
  }
  return { tampil: t.slice(0, Math.max(0, pas)).trimEnd() + '…', terpotong: true };
}

/* Vonis panjang judul: 50-60 karakter patokan umum (judul lebih dari itu
   biasanya terpotong di Google). */
export function nilaiJudul(judul) {
  const n = String(judul || '').trim().length;
  if (n === 0) return { nilai: 'kosong', pesan: 'Judul masih kosong.' };
  if (n < 30) return { nilai: 'pendek', pesan: n + ' karakter — agak pendek, judul 50–60 karakter memberi ruang lebih untuk kata kunci.' };
  if (n <= 60) return { nilai: 'pas', pesan: n + ' karakter — panjangnya pas, kecil kemungkinan terpotong.' };
  return { nilai: 'panjang', pesan: n + ' karakter — kemungkinan terpotong di hasil pencarian, coba persingkat jadi 50–60 karakter.' };
}

/* Vonis panjang deskripsi: 150–160 karakter patokan umum. */
export function nilaiDeskripsi(desk) {
  const n = String(desk || '').trim().length;
  if (n === 0) return { nilai: 'kosong', pesan: 'Deskripsi masih kosong — Google akan mengambil sendiri teks dari halamanmu.' };
  if (n < 120) return { nilai: 'pendek', pesan: n + ' karakter — agak pendek, deskripsi 150–160 karakter memanfaatkan ruang dengan baik.' };
  if (n <= 160) return { nilai: 'pas', pesan: n + ' karakter — panjangnya pas.' };
  return { nilai: 'panjang', pesan: n + ' karakter — kemungkinan terpotong, coba persingkat jadi 150–160 karakter.' };
}

const WARNA_VONIS = { pas: '#4ade80', pendek: '#facc15', panjang: '#f87171', kosong: '#a1a1aa' };

export const meta = {"id": "meta-generator", "name": "Meta Tag Generator", "cat": "developer", "icon": "🏷️", "desc": "Generator meta tag SEO + pratinjau Google (desktop & HP, potong sesuai lebar layar) dan kartu X.", "keywords": "meta,seo,tag,website,serp,twitter card,og,simulator serp,pratinjau pencarian,snippet,judul,deskripsi"};
export function render(root) {

    const fTitle = T.input('text', 'Judul halaman', '');
    const fDesc = T.ta(2, 'Deskripsi singkat halaman (150-160 karakter ideal)');
    const fKeys = T.input('text', 'kata kunci, dipisah koma', '');
    const fAuthor = T.input('text', 'Nama penulis/situs', '');
    const fUrl = T.input('text', 'https://situsmu.com/halaman', '');
    const fSitus = T.input('text', 'Nama situs (boleh kosong, diambil dari alamat)', '');
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

    const domainTampil = (url) => {
      const u = String(url || '').trim();
      if (!u) return 'contoh.com › halaman';
      const bersih = u.replace(/^https?:\/\//, '').replace(/\/$/, '');
      const bagi = bersih.split('/');
      return bagi.length > 1 ? bagi[0] + ' › ' + bagi.slice(1, 3).join(' › ') : bersih;
    };

    const domainDariUrl = (u) => {
      try { return new URL(u.trim()).hostname.replace(/^www\./, ''); } catch (e) { return ''; }
    };

    const breadcrumbDariUrl = (u) => {
      try {
        const url = new URL(u.trim());
        const segmen = url.pathname.split('/').filter(Boolean).slice(0, 3);
        return url.hostname.replace(/^www\./, '') + (segmen.length ? ' › ' + segmen.map((s) => decodeURIComponent(s).replace(/[-_]/g, ' ')).join(' › ') : '');
      } catch (e) { return u.trim() || 'contoh.com › halaman'; }
    };

    const paintSerp = () => {
      const title = fTitle.value.trim(), desc = fDesc.value.trim();
      const j = nilaiJudul(title);
      const d = nilaiDeskripsi(desc);
      cntTitle.innerHTML = '<span style="color:' + WARNA_VONIS[j.nilai] + '">' + esc(j.pesan) + '</span>';
      cntDesc.innerHTML = '<span style="color:' + WARNA_VONIS[d.nilai] + '">' + esc(d.pesan) + '</span>';
      bDesktop.classList.toggle('primary', serpMode === 'desktop');
      bMobile.classList.toggle('primary', serpMode === 'mobile');
      const hp = serpMode === 'mobile';
      if (!title && !desc) {
        serpBox.innerHTML = '<div class="hint">Pratinjau hasil pencarian muncul di sini setelah judul atau deskripsi diisi.</div>';
      } else {
        // Potong berdasarkan lebar pixel (seperti Google), bukan jumlah huruf.
        const maksJudul = hp ? JUDUL_PX_MOBILE : JUDUL_PX_DESKTOP;
        const maksDesk = hp ? DESK_PX_MOBILE : DESK_PX_DESKTOP;
        const judulPotong = potongPixel(title || '(judul belum diisi)', maksJudul, '20px Arial, sans-serif');
        // Deskripsi: potong per baris kasar — Google menampilkan ~2 baris desktop.
        let deskTampil = desc || '(deskripsi belum diisi)';
        const perBaris = Math.floor(maksDesk / 7.2); // perkiraan karakter per baris
        const maksKarakter = perBaris * 2;
        let deskTerpotong = false;
        if (deskTampil.length > maksKarakter) {
          deskTampil = deskTampil.slice(0, maksKarakter).trimEnd() + '…';
          deskTerpotong = true;
        }
        const domain = domainDariUrl(fUrl.value);
        const namaSitus = fSitus.value.trim() || domain || 'Nama situs';
        const huruf = (namaSitus.charAt(0) || '?').toUpperCase();
        serpBox.innerHTML =
          '<div class="hint" style="margin-bottom:6px">Pratinjau hasil Google ' + (hp ? '(HP)' : '(desktop)') + ' (perkiraan):</div>' +
          '<div style="background:#fff;border-radius:8px;padding:' + (hp ? '12px' : '14px 16px') + ';max-width:' + (hp ? '360px' : '600px') + ';font-family:Arial,Helvetica,sans-serif">' +
          '<div style="display:flex;align-items:center;gap:10px">' +
          '<span style="width:28px;height:28px;border-radius:50%;background:#f1f3f4;color:#5f6368;display:inline-flex;align-items:center;justify-content:center;font-size:15px;font-weight:700;flex:none">' + T.esc(huruf) + '</span>' +
          '<div style="min-width:0"><div style="font-size:14px;color:#202124;line-height:1.3">' + T.esc(namaSitus) + '</div>' +
          '<div style="font-size:12px;color:#5f6368;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + esc(breadcrumbDariUrl(fUrl.value)) + '</div></div></div>' +
          '<div style="margin-top:6px;font-size:' + (hp ? '18px' : '20px') + ';line-height:1.3;color:#1a0dab">' + esc(judulPotong.tampil) + '</div>' +
          '<div style="font-size:14px;line-height:1.58;color:#4d5156;margin-top:2px">' + esc(deskTampil) + '</div></div>' +
          ((judulPotong.terpotong || deskTerpotong) ? '<p class="hint" style="margin-top:6px">⚠️ ' + (judulPotong.terpotong ? 'Judul terpotong di tampilan ' + serpMode + '. ' : '') + (deskTerpotong ? 'Deskripsi terpotong di tampilan ' + serpMode + '.' : '') + '</p>' : '') +
          (hp ? '<div class="hint" style="margin-top:6px">Di HP, Google memotong judul &amp; deskripsi lebih pendek dari desktop.</div>' : '');
      }
      const ogT = fOgT.value.trim() || title, ogD = fOgD.value.trim() || desc, ogI = fOgI.value.trim();
      const besar = fTw.value === 'summary_large_image';
      if (!ogT && !ogD) {
        twBox.innerHTML = '<div class="hint">Pratinjau kartu X muncul di sini setelah judul atau deskripsi diisi.</div>';
      } else {
        const imgHtml = ogI
          ? '<img src="' + esc(ogI) + '" style="' + (besar ? 'width:100%;height:180px;object-fit:cover;display:block' : 'width:120px;height:120px;object-fit:cover;flex-shrink:0') + '" alt="" data-err="hide">'
          : '<div style="' + (besar ? 'width:100%;height:120px' : 'width:120px;height:120px;flex-shrink:0') + ';background:#16181c;display:flex;align-items:center;justify-content:center;color:#71767b;font-size:12px">tanpa gambar</div>';
        const bodyHtml = '<div style="padding:10px 12px"><div style="font-size:14px;color:#e7e9ea">' + esc(ogT || '(tanpa judul)') + '</div>' +
          '<div style="font-size:13px;color:#71767b;margin-top:2px;overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical">' + esc(ogD || '(tanpa deskripsi)') + '</div>' +
          '<div class="hint" style="margin-top:4px;color:#71767b">' + esc(domainTampil(fUrl.value).split(' › ')[0]) + '</div></div>';
        twBox.innerHTML =
          '<div class="hint" style="margin-bottom:6px">Pratinjau kartu X / Twitter:</div>' +
          '<div style="border-radius:12px;overflow:hidden;max-width:420px;border:1px solid #2f3336;background:#000;' + (besar ? '' : 'display:flex') + '">' + imgHtml + bodyHtml + '</div>' +
          (besar && !ogI ? '<div class="hint" style="margin-top:6px;color:#fbbf24">Kartu besar dipilih tapi gambar belum diisi. Isi og:image supaya kartu tampil dengan gambar.</div>' : '');
        T.wireImgErr(twBox);
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
    [fTitle, fDesc, fOgT, fOgD, fOgI, fTw, fUrl, fSitus].forEach((i) => i.addEventListener('input', paintSerp));
    fTw.addEventListener('change', paintSerp);
    root.appendChild(T.field('Title', fTitle));
    root.appendChild(cntTitle);
    root.appendChild(T.field('Author', fAuthor));
    root.appendChild(T.field('Description', fDesc));
    root.appendChild(cntDesc);
    root.appendChild(T.field('Keywords', fKeys));
    root.appendChild(T.field('URL halaman', fUrl, 'Dipakai untuk pratinjau alamat di Google, tag og:url, dan link canonical.'));
    root.appendChild(T.field('Nama situs (opsional)', fSitus, 'Nama yang tampil di pratinjau hasil pencarian. Kosongkan untuk memakai nama domain dari alamat.'));
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
