import { h as T, kv } from '../../core.js?v=6.13.0';

/* Fungsi murni — diekspor supaya bisa diuji dari node tanpa DOM.
   Heuristik ESTIMASI (bukan tokenizer resmi):
   - Teks Latin/angka/spasi: rata-rata ~4 karakter per token (aturan umum
     yang dipakai OpenAI dkk. untuk perkiraan kasar bahasa Inggris).
   - Karakter CJK (Cina/Jepang/Korea): ~1,5 token per karakter.
   - Emoji & simbol lain: ~2 token per karakter.
   Hasil selalu ditampilkan sebagai RENTANG ±20%, bukan angka pasti. */
export function estimasiToken(teks) {
  const s = String(teks == null ? '' : teks);
  if (!s) return { token: 0, kata: 0, karakter: 0 };
  let latin = 0, cjk = 0, lain = 0;
  for (const ch of s) {
    const cp = ch.codePointAt(0);
    if ((cp >= 0x2E80 && cp <= 0x9FFF) || (cp >= 0xAC00 && cp <= 0xD7AF) || (cp >= 0xF900 && cp <= 0xFAFF)) cjk++;
    else if (cp < 0x2E80) latin++;
    else lain++;
  }
  const token = Math.ceil(latin / 4 + cjk * 1.5 + lain * 2);
  const kata = s.trim().split(/\s+/).filter(Boolean).length;
  return { token, kata, karakter: [...s].length };
}

/** Biaya dalam USD dari jumlah token dan harga per 1 juta token. */
export function estimasiBiaya(token, hargaPerJuta) {
  return token / 1000000 * hargaPerJuta;
}

const fmtUSD = (n) => '$' + n.toFixed(n < 0.01 && n > 0 ? 4 : 2);
const fmtIDR = (n) => 'Rp' + Math.round(n).toLocaleString('id-ID');

export const meta = {"id": "penghitung-token-ai", "name": "Penghitung Token AI", "cat": "developer", "icon": "🪙", "desc": "Perkiraan jumlah token teks untuk AI (GPT/Claude/Gemini) + perkiraan biayanya. 100% estimasi, tanpa API.", "keywords": "token,ai,gpt,claude,gemini,biaya api,estimasi token,chatgpt", "since": "6.13.0"};
export function render(root) {

    const inp = T.ta(8, 'Tempel teks yang mau dikirim ke AI di sini…');
    const kursI = T.input('text', 'cth: 16500', '16500');
    kursI.inputMode = 'decimal';
    // Harga acuan per 1 juta token input (USD) — bisa diubah, cek harga resmi
    // penyedia saat memakai, karena harga berubah sewaktu-waktu.
    const harga = {
      gpt: { label: 'GPT (kelas menengah)', harga: 2.5 },
      claude: { label: 'Claude (kelas menengah)', harga: 3 },
      gemini: { label: 'Gemini (kelas ringan)', harga: 0.3 },
    };
    const hargaI = {};
    Object.keys(harga).forEach((k) => {
      const i = T.input('text', 'USD per 1 jt token', String(harga[k].harga));
      i.inputMode = 'decimal';
      hargaI[k] = i;
    });
    const box = T.out();

    const hitung = () => {
      const teks = inp.value;
      if (!teks.trim()) { T.hide(box); return; }
      const e = estimasiToken(teks);
      const bawah = Math.max(1, Math.round(e.token * 0.8));
      const atas = Math.round(e.token * 1.2);
      const kurs = T.num(kursI.value);
      const kursOk = isFinite(kurs) && kurs > 0;
      let biayaHtml = '';
      Object.keys(harga).forEach((k) => {
        const h = T.num(hargaI[k].value);
        if (!isFinite(h) || h < 0) return;
        const usd = estimasiBiaya(e.token, h);
        // Guard: harga raksasa menghasilkan $1e303 / Rp∞ (RT2-08) — tampilkan
        // pesan ramah, bukan notasi ilmiah 300 digit.
        if (!isFinite(usd) || usd > 1e15) {
          biayaHtml += kv('Perkiraan biaya ' + harga[k].label,
            'terlalu besar untuk dihitung — cek lagi harga per tokennya' +
            ' <span class="mut" style="font-size:12px">pada $' + String(h).replace('.', ',') + '/1 jt token</span>');
          return;
        }
        const idr = kursOk ? usd * kurs : NaN;
        // Rupiah hanya ditampilkan bila masuk akal dibaca (di bawah
        // Rp1.000 triliun); di atas itu angkanya ratusan digit.
        const idrOk = isFinite(idr) && idr < 1e18;
        biayaHtml += kv('Perkiraan biaya ' + harga[k].label,
          '±' + fmtUSD(usd) + (idrOk ? ' (≈ ' + fmtIDR(idr) + ')' : '') +
          ' <span class="mut" style="font-size:12px">pada $' + String(h).replace('.', ',') + '/1 jt token</span>');
      });
      T.show(box,
        '<div class="big center">±' + e.token.toLocaleString('id-ID') + ' <span class="mut" style="font-size:15px">token</span></div>' +
        '<p class="center">perkiraan rentang: ' + bawah.toLocaleString('id-ID') + ' – ' + atas.toLocaleString('id-ID') + ' token</p>' +
        kv('Karakter', e.karakter.toLocaleString('id-ID')) +
        kv('Kata', e.kata.toLocaleString('id-ID')) +
        kv('Rata-rata', e.kata ? (e.token / e.kata).toFixed(2).replace('.', ',') + ' token per kata' : '—') +
        biayaHtml +
        '<p class="warn">⚠️ Ini <b>ESTIMASI kasar (±20%)</b>, bukan hitungan tokenizer resmi. ' +
        'Tiap model punya tokenizer sendiri — GPT, Claude, dan Gemini bisa menghasilkan jumlah token yang beda untuk teks yang sama. ' +
        'Untuk angka pasti, pakai tokenizer resmi masing-masing penyedia. Harga di atas adalah harga acuan yang bisa kamu ubah — selalu cek harga resmi terbaru.</p>');
    };
    let t;
    inp.addEventListener('input', () => { clearTimeout(t); t = setTimeout(hitung, 200); });

    root.appendChild(T.el('<p class="note">Sebelum kirim teks panjang ke AI (atau ke API-nya), cek dulu kira-kira berapa token yang kepakai — dan berapa biayanya. Semua dihitung di HP ini, tanpa API dan tanpa kunci.</p>'));
    root.appendChild(T.field('Teks', inp, 'Hasil muncul otomatis saat kamu mengetik.'));
    root.appendChild(T.el('<h3 class="h3">💲 Harga acuan (USD per 1 juta token input)</h3>'));
    root.appendChild(T.field('GPT — kelas menengah', hargaI.gpt, 'Harga acuan, bisa diubah sesuai harga resmi saat ini.'));
    root.appendChild(T.field('Claude — kelas menengah', hargaI.claude, 'Harga acuan, bisa diubah sesuai harga resmi saat ini.'));
    root.appendChild(T.field('Gemini — kelas ringan', hargaI.gemini, 'Harga acuan, bisa diubah sesuai harga resmi saat ini.'));
    root.appendChild(T.field('Kurs USD → Rupiah', kursI, 'Untuk menampilkan perkiraan biaya dalam rupiah.'));
    root.appendChild(box);
    root.appendChild(T.row(T.btn('Contoh teks', () => {
      inp.value = 'Halo! Tolong buatkan ringkasan singkat tentang cara menanam cabai di pot untuk pemula, termasuk jenis tanah, penyiraman, dan kapan panennya.';
      hitung();
    })));

}
