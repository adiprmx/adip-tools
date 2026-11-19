import { h as T, fileInput } from '../../core.js';

// RTF ke Teks: ubah dokumen RTF (format lama pengolah kata) jadi teks
// polos. Parsernya ditulis sendiri: perintah format dibuang, yang
// dipertahankan hanya teksnya, baris baru, dan tab.
// BATASAN JUJUR: tabel jadi teks berurutan, gambar tidak ikut, dan
// karakter dari font simbol lama kadang tidak terbaca dengan benar.
export const meta = {"id": "rtf-ke-teks", "name": "RTF ke Teks", "cat": "produktivitas", "icon": "📝", "desc": "Ubah dokumen RTF jadi teks polos, tempel isinya atau unggah filenya.", "keywords": "rtf ke teks,rtf to txt,konversi rtf,baca rtf,rich text format", "since": "6.18.0"};

// Grup tujuan yang isinya bukan teks dokumen (font, warna, gambar, info).
const TUJUAN_LEWAT = new Set([
  'fonttbl', 'colortbl', 'stylesheet', 'info', 'pict', 'object', 'shppict',
  'themedata', 'colorschememapping', 'latentstyles', 'datastore', 'rsidtbl',
  'generator', 'listtable', 'listoverridetable', 'revtbl', 'xmlnstbl',
]);

// Ubah dokumen RTF jadi teks polos. Murni, bisa diuji di Node.
export function rtfKeTeks(rtf) {
  const s = String(rtf || '');
  if (!s.trim().startsWith('{\\rtf')) return '';
  let keluar = '';
  let i = 0;
  let kedalamanLewat = 0;
  const tumpukan = [];
  const n = s.length;
  while (i < n) {
    const c = s[i];
    if (c === '{') {
      tumpukan.push(kedalamanLewat);
      i++;
      // Grup tujuan: {\*\kata atau {\kata-tujuan -> lewati seluruh grup.
      let j = i;
      if (s[j] === '\\' && s[j + 1] === '*') j += 2;
      if (s[j] === '\\') {
        const m = /\\([a-zA-Z]+)/.exec(s.slice(j, j + 32));
        if (m && (s[j - 2] === '*' || TUJUAN_LEWAT.has(m[1].toLowerCase()))) kedalamanLewat++;
      }
      continue;
    }
    if (c === '}') {
      if (tumpukan.length) kedalamanLewat = tumpukan.pop();
      i++;
      continue;
    }
    if (kedalamanLewat > 0) { i++; continue; }
    if (c === '\\') {
      const berikut = s[i + 1];
      if (berikut === "'") {
        const hex = s.slice(i + 2, i + 4);
        const kode = parseInt(hex, 16);
        if (!isNaN(kode)) keluar += String.fromCharCode(kode);
        i += 4;
        continue;
      }
      if (berikut === '\\' || berikut === '{' || berikut === '}') { keluar += berikut; i += 2; continue; }
      if (berikut === '~') { keluar += ' '; i += 2; continue; }
      if (berikut === '-') { i += 2; continue; }
      if (berikut === '_') { keluar += '-'; i += 2; continue; }
      const m = /\\([a-zA-Z]+)(-?\d+)? ?/.exec(s.slice(i, i + 40));
      if (m) {
        const kata = m[1].toLowerCase();
        const angka = m[2] != null ? Number(m[2]) : null;
        if (kata === 'par' || kata === 'line' || kata === 'page') keluar += '\n';
        else if (kata === 'tab') keluar += '\t';
        else if (kata === 'u' && angka != null) {
          const kode = angka < 0 ? angka + 65536 : angka;
          try { keluar += String.fromCodePoint(kode); } catch (e) { /* abaikan */ }
          // Lewati satu karakter pengganti setelah \uN (bila ada dan bukan kontrol).
          let k = i + m[0].length;
          if (k < n && s[k] !== '\\' && s[k] !== '{' && s[k] !== '}') k++;
          i = k;
          continue;
        }
        i += m[0].length;
        continue;
      }
      i++;
      continue;
    }
    if (c === '\r' || c === '\n') { i++; continue; }
    keluar += c;
    i++;
  }
  return keluar.split('\n').map((b) => b.replace(/[ \t]+/g, ' ').trim()).filter(Boolean).join('\n');
}

export function render(root) {
  const tempelI = T.ta(8, 'Tempel isi file RTF di sini…\n\nContoh: {\\rtf1\\ansi Halo \\b dunia\\b0\\par Baris baru}', '');
  const fi = fileInput('.rtf,text/rtf,application/rtf');
  const box = T.out();
  const hasilBox = T.out();

  const tampilkan = (teks) => {
    if (!teks) {
      T.show(box, '<div class="err">Tidak ada teks yang bisa diambil. Pastikan isinya dokumen RTF yang benar (diawali {\\rtf).</div>');
      T.hide(hasilBox);
      return;
    }
    const jumlahKata = teks.split(/\s+/).filter(Boolean).length;
    T.show(box, '<p class="note">Teks berhasil diambil (' + T.fmt(jumlahKata) + ' kata).</p><pre style="white-space:pre-wrap;word-break:break-word;background:#12100d;border:1px solid #2e2823;border-radius:8px;padding:12px;font-size:13px;line-height:1.6;max-height:420px;overflow:auto">' + T.esc(teks) + '</pre>');
    T.show(hasilBox, '');
    hasilBox.appendChild(T.btn('Unduh Teks (.txt)', () => { T.dl('hasil-rtf.txt', teks, 'text/plain;charset=utf-8'); T.toast('Berhasil diunduh'); }, true));
    hasilBox.appendChild(T.copyBtn(() => teks, 'Salin Teks'));
    T.scrollToPreview(box);
  };

  const dariTempel = () => {
    const isi = tempelI.value.trim();
    if (!isi) { T.toast('Tempel dulu isi RTF-nya'); return; }
    tampilkan(rtfKeTeks(isi));
  };

  const dariFile = () => {
    const f = fi.files && fi.files[0];
    if (!f) { T.toast('Pilih file RTF dulu'); return; }
    if (typeof FileReader === 'undefined') { T.toast('Peramban ini tidak bisa membaca file'); return; }
    const r = new FileReader();
    r.onload = () => tampilkan(rtfKeTeks(String(r.result || '')));
    r.onerror = () => T.show(box, '<div class="err">File tidak bisa dibaca. Coba file lain.</div>');
    r.readAsText(f);
  };

  root.appendChild(T.el('<p class="note">Yang keluar hanya teks polosnya saja. Tabel jadi teks berurutan dan gambar tidak ikut.</p>'));
  root.appendChild(T.field('Tempel isi RTF', tempelI));
  root.appendChild(T.btn('Ubah Tempelan', dariTempel, true));
  root.appendChild(T.field('Atau pilih file RTF', fi));
  root.appendChild(T.btn('Ubah File', dariFile));
  root.appendChild(box);
  root.appendChild(hasilBox);
}
