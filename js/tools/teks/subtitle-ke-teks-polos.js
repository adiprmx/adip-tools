import { h as T, fileInput } from '../../core.js';

// Subtitle ke Teks Polos: ambil hanya kata-katanya dari file subtitle
// (SRT, VTT, ASS, SBV). Nomor urut, penanda waktu, dan kode tampilannya
// dibuang. Baris yang sama berulang hanya diambil sekali.
export const meta = {"id": "subtitle-ke-teks-polos", "name": "Subtitle ke Teks Polos", "cat": "teks", "icon": "💬", "desc": "Ambil hanya teksnya dari file subtitle, tanpa nomor dan penanda waktu.", "keywords": "subtitle ke teks,srt ke teks,vtt ke teks,ekstrak subtitle,subtitle polos,transkrip subtitle", "since": "6.18.0"};

// Tebak format dari isinya. Murni, bisa diuji di Node.
export function deteksiFormat(teks) {
  const s = String(teks || '');
  if (/^\s*WEBVTT/i.test(s)) return 'vtt';
  if (/\[Script Info\]|\[Events\]|Dialogue:/i.test(s)) return 'ass';
  if (/^\d+:\d{2}:\d{2}\.\d+,\d+:\d{2}:\d{2}\.\d+/m.test(s)) return 'sbv';
  if (/\d{2}:\d{2}:\d{2}[,.]\d{3}\s*-->\s*\d{2}:\d{2}:\d{2}[,.]\d{3}/.test(s)) return 'srt';
  return 'tidak dikenal';
}

function bersihBaris(b) {
  let s = String(b || '');
  s = s.replace(/\{[^}]*\}/g, '');
  s = s.replace(/<[^>]+>/g, '');
  s = s.replace(/\\N/gi, ' ');
  s = s.replace(/&nbsp;/gi, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
  return s.replace(/\s+/g, ' ').trim();
}

// Ambil hanya teks dari subtitle. Opsi gabung: true = satu paragraf utuh,
// false = satu baris per kalimat subtitle. Murni, bisa diuji di Node.
export function subtitleKeTeks(teks, gabung) {
  const src = String(teks || '').replace(/\r\n?/g, '\n');
  const format = deteksiFormat(src);
  const barisKeluar = [];
  const dorong = (b) => {
    const bersih = bersihBaris(b);
    if (!bersih) return;
    if (barisKeluar.length && barisKeluar[barisKeluar.length - 1] === bersih) return;
    barisKeluar.push(bersih);
  };
  if (format === 'ass') {
    src.split('\n').forEach((baris) => {
      const m = /^Dialogue:\s*(.*)$/.exec(baris.trim());
      if (!m) return;
      const kolom = m[1].split(',');
      if (kolom.length >= 10) dorong(kolom.slice(9).join(','));
    });
  } else {
    src.split('\n').forEach((baris) => {
      const b = baris.trim();
      if (!b) return;
      if (/^WEBVTT/i.test(b)) return;
      if (/^\d+$/.test(b)) return;
      if (b.includes('-->')) return;
      if (/^\d{1,2}:\d{2}:\d{2}[,.]\d{1,3},\d{1,2}:\d{2}:\d{2}[,.]\d{1,3}$/.test(b)) return;
      if (/^(NOTE|STYLE|REGION)([ :]|$)/i.test(b)) return;
      dorong(b);
    });
  }
  if (!barisKeluar.length) return '';
  return gabung ? barisKeluar.join(' ') : barisKeluar.join('\n');
}

export function render(root) {
  const tempelI = T.ta(8, 'Tempel isi subtitle di sini…\n\n1\n00:00:01,000 --> 00:00:04,000\nHalo, selamat datang.', '');
  const fi = fileInput('.srt,.vtt,.ass,.ssa,.sbv,text/plain');
  const gabungI = T.select([['baris', 'Satu baris per kalimat'], ['paragraf', 'Gabung jadi satu paragraf']], 'baris');
  const box = T.out();
  const hasilBox = T.out();

  const tampilkan = (isi) => {
    const format = deteksiFormat(isi);
    const teks = subtitleKeTeks(isi, gabungI.value === 'paragraf');
    if (!teks) {
      T.show(box, '<div class="err">Tidak ada teks yang bisa diambil. Pastikan isinya subtitle yang benar (SRT, VTT, ASS, atau SBV).</div>');
      T.hide(hasilBox);
      return;
    }
    const jumlahKata = teks.split(/\s+/).filter(Boolean).length;
    const jumlahBaris = teks.split('\n').length;
    T.show(box, '<p class="note">Format terdeteksi: <b>' + T.esc(format.toUpperCase()) + '</b>. Teks berhasil diambil (' + T.fmt(jumlahBaris) + ' baris, ' + T.fmt(jumlahKata) + ' kata).</p><pre style="white-space:pre-wrap;word-break:break-word;background:#12100d;border:1px solid #2e2823;border-radius:8px;padding:12px;font-size:13px;line-height:1.6;max-height:420px;overflow:auto">' + T.esc(teks) + '</pre>');
    T.show(hasilBox, '');
    hasilBox.appendChild(T.btn('Unduh Teks (.txt)', () => { T.dl('subtitle-teks.txt', teks, 'text/plain;charset=utf-8'); T.toast('Berhasil diunduh'); }, true));
    hasilBox.appendChild(T.copyBtn(() => teks, 'Salin Teks'));
    T.scrollToPreview(box);
  };

  const dariTempel = () => {
    if (!tempelI.value.trim()) { T.toast('Tempel dulu isi subtitlenya'); return; }
    tampilkan(tempelI.value);
  };

  const dariFile = () => {
    const f = fi.files && fi.files[0];
    if (!f) { T.toast('Pilih file subtitle dulu'); return; }
    if (typeof FileReader === 'undefined') { T.toast('Peramban ini tidak bisa membaca file'); return; }
    const r = new FileReader();
    r.onload = () => tampilkan(String(r.result || ''));
    r.onerror = () => T.show(box, '<div class="err">File tidak bisa dibaca. Coba file lain.</div>');
    r.readAsText(f);
  };

  root.appendChild(T.el('<p class="note">Nomor urut, penanda waktu, dan kode tampilan dibuang. Baris yang sama berulang hanya diambil sekali.</p>'));
  root.appendChild(T.field('Tempel isi subtitle', tempelI));
  root.appendChild(T.field('Hasilnya mau seperti apa', gabungI));
  root.appendChild(T.btn('Ambil Teksnya', dariTempel, true));
  root.appendChild(T.field('Atau pilih file subtitle', fi));
  root.appendChild(T.btn('Ambil dari File', dariFile));
  root.appendChild(box);
  root.appendChild(hasilBox);
}
