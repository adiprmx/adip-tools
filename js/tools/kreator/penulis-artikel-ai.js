import { h as T, utils } from '../../core.js';

export const meta = {"id":"penulis-artikel-ai","name":"Penulis Artikel AI","cat":"kreator","icon":"📰","desc":"Draf artikel dari topik, gaya, dan panjang yang kamu mau.","keywords":"artikel,penulis,draf,ai,puter","since":"6.18.0", "online": true};

const GAYA = [
  ['informatif', 'Informatif', 'informatif, langsung ke isi yang penting'],
  ['santai', 'Santai', 'santai seperti sedang ngobrol'],
  ['formal', 'Formal', 'formal dan rapi'],
];
const PANJANG = [
  ['singkat', 'Singkat (sekitar 300 kata)', 'sekitar 300 kata'],
  ['sedang', 'Sedang (sekitar 600 kata)', 'sekitar 600 kata'],
  ['panjang', 'Panjang (sekitar 1000 kata)', 'sekitar 1000 kata'],
];

// Ekstrak teks dari respons puter.ai.chat (bentuknya bisa string / objek).
// chatText, errPesan kanonis tinggal di utils (core.js).

// Pembentuk prompt murni (bisa diuji tanpa SDK).
export function buatPrompt(o) {
  const g = GAYA.find(([v]) => v === (o && o.gaya)) || GAYA[0];
  const p = PANJANG.find(([v]) => v === (o && o.panjang)) || PANJANG[1];
  return 'Tuliskan draf artikel dalam Bahasa Indonesia.\n\n' +
    'Topik: ' + (o.topik || '') + '\n\n' +
    'Gayanya ' + g[2] + ', panjangnya ' + p[2] + '. Artikelnya punya judul, pembuka, beberapa subjudul, dan penutup. ' +
    'Jangan mengarang angka, nama orang, atau kutipan. Kalau ada hal yang tidak pasti, tulis saja secara umum. ' +
    'Jawab HANYA dengan artikelnya, tanpa penjelasan tambahan.';
}

export function render(root) {
  const puter = utils.puter.panel();
  root.appendChild(puter.box);
  puter.refresh();

  let alive = true, busy = false, lastHasil = '';
  T.onLeave(() => { alive = false; });

  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Tulis topiknya, pilih gaya dan panjangnya, dan AI akan menulis draf artikel yang tinggal kamu poles. Diproses lewat <b>akun Puter milikmu</b> (login gratis, sekali saja). Teksmu tidak disimpan di mana pun.</p>'));

  /* ---------- Input ---------- */
  const topikInp = T.input('text', 'Contoh: Cara mulai berkebun di lahan sempit, sejarah kopi di Indonesia');
  topikInp.maxLength = 200;
  root.appendChild(T.field('Topik artikel', topikInp));

  const gayaSel = T.select(GAYA.map(([v, l]) => [v, l]), 'informatif');
  root.appendChild(T.field('Gaya penulisan', gayaSel));

  const panjangSel = T.select(PANJANG.map(([v, l]) => [v, l]), 'sedang');
  root.appendChild(T.field('Panjang artikel', panjangSel));

  const statusBox = T.el('<div class="dim" style="font-size:12.5px;margin:8px 0;min-height:18px" role="status" aria-live="polite"></div>');
  const setStatus = (t, cls) => { if (alive) statusBox.innerHTML = t ? '<span class="' + (cls || '') + '">' + t + '</span>' : ''; };

  const out = T.out();

  function tampilHasil(teks, detik) {
    lastHasil = teks;
    T.show(out,
      '<div style="border:1px solid #ffffff20;border-radius:10px;padding:12px">' +
      '<div style="font-weight:700;font-size:13px;margin-bottom:6px">Hasil artikel</div>' +
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
    if (topik.length < 3) { setStatus('Tulis dulu topiknya (minimal 3 huruf).', 'err'); topikInp.focus(); return; }
    await puter.need(async () => {
      busy = true; aksiBtn.disabled = true; aksiBtn.textContent = 'AI sedang menulis…';
      setStatus('AI sedang menulis artikelmu…', '');
      T.show(out, '<div class="dim center" style="padding:18px 0">Menunggu jawaban AI…</div>');
      const t0 = performance.now();
      try {
        const prompt = buatPrompt({ topik, gaya: gayaSel.value, panjang: panjangSel.value });
        const res = await Promise.race([
          Promise.resolve(window.puter.ai.chat(prompt, {})),
          new Promise((_, rej) => setTimeout(() => rej(new Error('TIMEOUT: AI tidak bisa dihubungi dalam 60 detik.')), 60000)),
        ]);
        const hasil = utils.chatText(res).trim();
        if (!hasil) throw new Error('Puter mengembalikan respons kosong.');
        if (!alive) return;
        const detik = ((performance.now() - t0) / 1000).toFixed(1);
        tampilHasil(hasil, detik);
      } catch (e) {
        if (alive) tampilError(utils.errPesan(e));
      } finally {
        if (alive) { busy = false; aksiBtn.disabled = false; aksiBtn.textContent = 'Tulis Artikel'; }
      }
    });
  }

  const aksiBtn = T.btn('Tulis Artikel', () => jalan(), true);
  root.appendChild(T.el('<div style="height:8px"></div>'));
  root.appendChild(T.row(aksiBtn));
  root.appendChild(statusBox);
  root.appendChild(out);
  root.appendChild(T.el(utils.puter.poweredBy()));
}
