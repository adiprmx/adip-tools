import { h as T, utils } from '../../core.js';

export const meta = {"id":"penulis-esai-ai","name":"Penulis Esai AI","cat":"pelajar","icon":"🎓","desc":"Draf esai terstruktur dari topik dan argumenmu.","keywords":"esai,penulis,tugas,sekolah,kuliah,ai,puter","since":"6.18.0"};

const MAX_ARGUMEN = 2000;
const PANJANG = [
  ['300', 'Sekitar 300 kata', 'sekitar 300 kata'],
  ['500', 'Sekitar 500 kata', 'sekitar 500 kata'],
  ['800', 'Sekitar 800 kata', 'sekitar 800 kata'],
];

// Ekstrak teks dari respons puter.ai.chat (bentuknya bisa string / objek).
// chatText, errPesan kanonis tinggal di utils (core.js).

// Pembentuk prompt murni (bisa diuji tanpa SDK).
export function buatPrompt(o) {
  const p = PANJANG.find(([v]) => v === (o && o.panjang)) || PANJANG[1];
  return 'Tuliskan draf esai dalam Bahasa Indonesia.\n\n' +
    'Topik: ' + (o.topik || '') + '\n' +
    'Argumen utama: ' + (o.argumen || '') + '\n\n' +
    'Panjangnya ' + p[2] + '. Strukturnya: pendahuluan dengan pendapat utama, 2 sampai 3 paragraf isi yang mengembangkan argumen, dan penutup. ' +
    'Jangan mengarang angka, nama orang, atau kutipan. Kalau ada hal yang tidak pasti, tulis saja secara umum. ' +
    'Jawab HANYA dengan esainya, tanpa penjelasan tambahan.';
}

export function render(root) {
  const puter = utils.puter.panel();
  root.appendChild(puter.box);
  puter.refresh();

  let alive = true, busy = false, lastHasil = '';
  T.onLeave(() => { alive = false; });

  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Tulis topik dan argumenmu, dan AI akan menyusun draf esai yang terstruktur. Hasilnya draf awal, jadi baca ulang dan sesuaikan dengan gayamu sendiri sebelum dipakai. Diproses lewat <b>akun Puter milikmu</b> (login gratis, sekali saja). Teksmu tidak disimpan di mana pun.</p>'));

  /* ---------- Input ---------- */
  const topikInp = T.input('text', 'Contoh: Pentingnya membaca buku di era digital');
  topikInp.maxLength = 200;
  root.appendChild(T.field('Topik esai', topikInp));

  const argumenTa = T.ta(3, 'Apa argumen utamamu? Contoh: Membaca buku melatih fokus dan imajinasi, dua hal yang sulit didapat dari konten video pendek.');
  argumenTa.maxLength = MAX_ARGUMEN;
  const hitung = T.el('<div class="dim" style="font-size:11.5px;text-align:right;margin-top:2px">0 / ' + MAX_ARGUMEN + '</div>');
  argumenTa.addEventListener('input', () => { hitung.textContent = argumenTa.value.length + ' / ' + MAX_ARGUMEN; });
  root.appendChild(T.field('Argumen utama', argumenTa));
  root.appendChild(hitung);

  const panjangSel = T.select(PANJANG.map(([v, l]) => [v, l]), '500');
  root.appendChild(T.field('Panjang esai', panjangSel));

  const statusBox = T.el('<div class="dim" style="font-size:12.5px;margin:8px 0;min-height:18px" role="status" aria-live="polite"></div>');
  const setStatus = (t, cls) => { if (alive) statusBox.innerHTML = t ? '<span class="' + (cls || '') + '">' + t + '</span>' : ''; };

  const out = T.out();

  function tampilHasil(teks, detik) {
    lastHasil = teks;
    T.show(out,
      '<div style="border:1px solid #ffffff20;border-radius:10px;padding:12px">' +
      '<div style="font-weight:700;font-size:13px;margin-bottom:6px">Hasil draf esai</div>' +
      '<div style="font-size:14px;line-height:1.7;white-space:pre-wrap;word-break:break-word">' + T.esc(teks) + '</div>' +
      '</div>');
    const row = T.el('<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px"></div>');
    row.appendChild(T.copyBtn(() => lastHasil, 'Salin hasil'));
    row.appendChild(T.btn('Tulis lagi', () => jalan()));
    out.appendChild(row);
    setStatus('Selesai dalam ' + detik + ' detik.', 'ok');
  }

  function tampilError(pesan) {
    T.show(out,
      '<div class="err" style="border:1px solid #ff6b6b40;border-radius:10px;padding:12px;font-size:13px;line-height:1.6">' + T.esc(pesan) + '</div>');
    const row = T.el('<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px"></div>');
    row.appendChild(T.btn('Coba lagi', () => jalan(), true));
    out.appendChild(row);
    setStatus('', '');
  }

  async function jalan() {
    if (busy || !alive) return;
    const topik = topikInp.value.trim();
    const argumen = argumenTa.value.trim();
    if (topik.length < 3) { setStatus('Tulis dulu topiknya (minimal 3 huruf).', 'err'); topikInp.focus(); return; }
    if (argumen.length < 10) { setStatus('Tulis argumenmu sedikit lebih lengkap (minimal 10 huruf).', 'err'); argumenTa.focus(); return; }
    await puter.need(async () => {
      busy = true; aksiBtn.disabled = true; aksiBtn.textContent = 'AI sedang menulis…';
      setStatus('AI sedang menyusun draf esaimu…', '');
      T.show(out, '<div class="dim center" style="padding:18px 0">Menunggu jawaban AI…</div>');
      const t0 = performance.now();
      try {
        const prompt = buatPrompt({ topik, argumen, panjang: panjangSel.value });
        const res = await Promise.race([
          Promise.resolve(window.puter.ai.chat(prompt, {})),
          new Promise((_, rej) => setTimeout(() => rej(new Error('TIMEOUT: AI tidak merespons dalam 60 detik.')), 60000)),
        ]);
        const hasil = utils.chatText(res).trim();
        if (!hasil) throw new Error('Puter mengembalikan respons kosong.');
        if (!alive) return;
        const detik = ((performance.now() - t0) / 1000).toFixed(1);
        tampilHasil(hasil, detik);
      } catch (e) {
        if (alive) tampilError(utils.errPesan(e));
      } finally {
        if (alive) { busy = false; aksiBtn.disabled = false; aksiBtn.textContent = 'Tulis Esai'; }
      }
    });
  }

  const aksiBtn = T.btn('Tulis Esai', () => jalan(), true);
  root.appendChild(T.el('<div style="height:8px"></div>'));
  root.appendChild(T.row(aksiBtn));
  root.appendChild(statusBox);
  root.appendChild(out);
  root.appendChild(T.el(utils.puter.poweredBy()));
}
