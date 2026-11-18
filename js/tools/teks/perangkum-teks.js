import { h as T, utils } from '../../core.js';

// Ringkasan ekstraktif: kalimat dipotong, tiap kata dihitung frekuensinya
// (kata umum Indonesia dikecualikan), kalimat dengan skor tertinggi dipilih
// lalu diurutkan kembali seperti di teks asli. Tidak ada AI di sini.
const STOP = new Set(('yang dan di ke dari untuk dengan ini itu adalah pada dalam sebagai oleh atau juga tidak akan sudah dapat bisa ada karena jika saat setelah sebelum antara terhadap lebih sangat hanya setiap semua mereka dia kami kita saya kamu ia pun lah kah tapi namun sehingga agar supaya baik maupun serta lalu kemudian masih belum pernah sering selalu kadang mungkin harus perlu ingin mau jadi menjadi merupakan yaitu yakni misalnya contoh berikut tersebut hal cara ketika dimana bagaimana apa siapa mana berapa mengapa adalah ialah yakni yaitu').split(' '));

utils.ringkasTeks = function (teks, jumlah) {
  const kalimat = String(teks || '').replace(/\s+/g, ' ').trim()
    .split(/(?<=[.!?])\s+(?=[A-Z0-9"“])/).map((s) => s.trim()).filter(Boolean);
  if (kalimat.length === 0) return [];
  const frek = {};
  kalimat.forEach((k) => {
    k.toLowerCase().replace(/[^a-z0-9\u00c0-\u024f ]/gi, ' ').split(/\s+/)
      .forEach((w) => { if (w.length > 2 && !STOP.has(w)) frek[w] = (frek[w] || 0) + 1; });
  });
  const skor = kalimat.map((k, i) => {
    let s = 0;
    k.toLowerCase().replace(/[^a-z0-9\u00c0-\u024f ]/gi, ' ').split(/\s+/)
      .forEach((w) => { if (frek[w]) s += frek[w]; });
    return { i, s, len: k.split(/\s+/).length };
  });
  const n = Math.max(1, Math.min(jumlah, kalimat.length));
  const pilih = skor.sort((a, b) => (b.s / Math.sqrt(b.len)) - (a.s / Math.sqrt(a.len)))
    .slice(0, n).sort((a, b) => a.i - b.i);
  return pilih.map((p) => kalimat[p.i]);
};

export const meta = {"id": "perangkum-teks", "name": "Perangkum Teks", "cat": "teks", "icon": "📝", "desc": "Ringkas teks panjang jadi beberapa kalimat penting. Berjalan di browser, tanpa AI.", "keywords": "ringkas,rangkum,ringkasan,teks,kalimat,ekstraktif", "since": "6.16.0"};
export function render(root) {
  const ta = T.ta(8, 'Tempel teks panjang di sini…');
  const jml = T.select([['3', '3 kalimat'], ['5', '5 kalimat'], ['7', '7 kalimat'], ['10', '10 kalimat']], '5');
  const box = T.out();
  const hasil = T.el('<div></div>');
  const salinBtn = T.copyBtn(() => hasil.dataset.teks || '', 'Salin ringkasan');

  const hitungKata = (s) => String(s || '').trim().split(/\s+/).filter(Boolean).length;

  const buat = () => {
    const teks = ta.value.trim();
    if (!teks) { T.hide(box); return; }
    const ringkasan = utils.ringkasTeks(teks, Number(jml.value));
    const kataAsli = hitungKata(teks);
    const kataHasil = hitungKata(ringkasan.join(' '));
    const persen = kataAsli > 0 ? Math.round((1 - kataHasil / kataAsli) * 100) : 0;
    hasil.dataset.teks = ringkasan.join(' ');
    hasil.innerHTML = '<p style="line-height:1.7">' + T.esc(ringkasan.join(' ')) + '</p>';
    T.show(box,
      '<p class="mut">Dari ' + kataAsli + ' kata jadi ' + kataHasil + ' kata (' + ringkasan.length + ' kalimat) — lebih singkat ' + persen + '%.</p>' +
      '<p class="hint">Ini ringkasan ekstraktif: alat ini memilih kalimat-kalimat yang paling penting dari teksmu, bukan menulis ulang dengan AI. Kalimat hasil ringkasan adalah kalimat asli dari teksmu.</p>');
    box.appendChild(hasil);
    box.appendChild(salinBtn);
  };

  root.appendChild(T.el('<p class="note">Tempel teks panjang, pilih mau berapa kalimat, dan alat ini akan memilih kalimat-kalimat yang paling penting. Semua diproses di browsermu — teks tidak dikirim ke mana-mana.</p>'));
  root.appendChild(T.field('Teks yang mau diringkas', ta));
  root.appendChild(T.field('Panjang ringkasan', jml));
  const btn = T.btn('Buat ringkasan', buat);
  root.appendChild(T.el('<div style="margin:4px 0 12px"></div>'));
  root.lastChild.appendChild(btn);
  root.appendChild(box);
}
