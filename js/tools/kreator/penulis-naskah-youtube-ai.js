import { h as T, utils } from '../../core.js';

export const meta = {"id":"penulis-naskah-youtube-ai","name":"Penulis Naskah YouTube AI","cat":"kreator","icon":"▶️","desc":"Naskah video YouTube dari topik dan gayamu.","keywords":"youtube,naskah,video,skrip,ai,puter","since":"6.18.0"};

const DURASI = [
  ['5', 'Sekitar 5 menit', 'sekitar 5 menit'],
  ['10', 'Sekitar 10 menit', 'sekitar 10 menit'],
  ['15', 'Sekitar 15 menit', 'sekitar 15 menit'],
];
const GAYA = [
  ['santai', 'Santai', 'santai seperti sedang ngobrol dengan penonton'],
  ['edukatif', 'Edukatif', 'edukatif, penonton pulang dengan ilmu baru'],
  ['hiburan', 'Hiburan', 'menghibur dan ringan'],
];

// Ekstrak teks dari respons puter.ai.chat (bentuknya bisa string / objek).
// chatText, errPesan kanonis tinggal di utils (core.js).

// Pembentuk prompt murni (bisa diuji tanpa SDK).
export function buatPrompt(o) {
  const d = DURASI.find(([v]) => v === (o && o.durasi)) || DURASI[1];
  const g = GAYA.find(([v]) => v === (o && o.gaya)) || GAYA[0];
  return 'Tuliskan naskah video YouTube dalam Bahasa Indonesia.\n\n' +
    'Topik: ' + (o.topik || '') + '\n' +
    'Durasi: ' + d[2] + '\n' +
    'Gaya: ' + g[2] + '\n\n' +
    'Naskahnya berisi: hook pembuka yang langsung menarik perhatian, isi yang dibagi ke beberapa segmen dengan jeda yang jelas, dan penutup dengan ajakan subscribe. ' +
    'Bahasa lisan yang enak diucapkan, bukan bahasa tulisan kaku. ' +
    'Jawab HANYA dengan naskahnya, tanpa penjelasan tambahan.';
}

export function render(root) {
  const puter = utils.puter.panel();
  root.appendChild(puter.box);
  puter.refresh();

  let alive = true, busy = false, lastHasil = '';
  T.onLeave(() => { alive = false; });

  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Tulis topik videonya, pilih durasi dan gayanya, dan AI akan menyusun naskah lengkap dengan hook pembuka dan penutup. Diproses lewat <b>akun Puter milikmu</b> (login gratis, sekali saja). Teksmu tidak disimpan di mana pun.</p>'));

  /* ---------- Input ---------- */
  const topikInp = T.input('text', 'Contoh: Review HP 3 jutaan, cara bikin kopi susu di rumah');
  topikInp.maxLength = 200;
  root.appendChild(T.field('Topik video', topikInp));

  const durasiSel = T.select(DURASI.map(([v, l]) => [v, l]), '10');
  root.appendChild(T.field('Durasi video', durasiSel));

  const gayaSel = T.select(GAYA.map(([v, l]) => [v, l]), 'santai');
  root.appendChild(T.field('Gaya video', gayaSel));

  const statusBox = T.el('<div class="dim" style="font-size:12.5px;margin:8px 0;min-height:18px" role="status" aria-live="polite"></div>');
  const setStatus = (t, cls) => { if (alive) statusBox.innerHTML = t ? '<span class="' + (cls || '') + '">' + t + '</span>' : ''; };

  const out = T.out();

  function tampilHasil(teks, detik) {
    lastHasil = teks;
    T.show(out,
      '<div style="border:1px solid #ffffff20;border-radius:10px;padding:12px">' +
      '<div style="font-weight:700;font-size:13px;margin-bottom:6px">Hasil naskah YouTube</div>' +
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
      setStatus('AI sedang menyusun naskahmu…', '');
      T.show(out, '<div class="dim center" style="padding:18px 0">Menunggu jawaban AI…</div>');
      const t0 = performance.now();
      try {
        const prompt = buatPrompt({ topik, durasi: durasiSel.value, gaya: gayaSel.value });
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
        if (alive) { busy = false; aksiBtn.disabled = false; aksiBtn.textContent = 'Tulis Naskah'; }
      }
    });
  }

  const aksiBtn = T.btn('Tulis Naskah', () => jalan(), true);
  root.appendChild(T.el('<div style="height:8px"></div>'));
  root.appendChild(T.row(aksiBtn));
  root.appendChild(statusBox);
  root.appendChild(out);
  root.appendChild(T.el(utils.puter.poweredBy()));
}
