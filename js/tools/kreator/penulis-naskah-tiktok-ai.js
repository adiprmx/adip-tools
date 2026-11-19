import { h as T, utils } from '../../core.js';

export const meta = {"id":"penulis-naskah-tiktok-ai","name":"Penulis Naskah TikTok AI","cat":"kreator","icon":"🎵","desc":"Naskah video TikTok singkat dari idemu.","keywords":"tiktok,naskah,video,skrip,ai,puter","since":"6.18.0"};

const MAX_IDE = 2000;
const DURASI = [
  ['15', '15 detik', '15 detik'],
  ['30', '30 detik', '30 detik'],
  ['60', '60 detik', '60 detik'],
];
const GAYA = [
  ['lucu', 'Lucu', 'lucu dan ringan'],
  ['edukatif', 'Edukatif', 'edukatif, penonton pulang dengan ilmu baru'],
  ['tren', 'Ikut tren', 'mengikuti gaya video yang sedang tren'],
];

// Ekstrak teks dari respons puter.ai.chat (bentuknya bisa string / objek).
// chatText, errPesan kanonis tinggal di utils (core.js).

// Pembentuk prompt murni (bisa diuji tanpa SDK).
export function buatPrompt(o) {
  const d = DURASI.find(([v]) => v === (o && o.durasi)) || DURASI[1];
  const g = GAYA.find(([v]) => v === (o && o.gaya)) || GAYA[0];
  return 'Tuliskan naskah video TikTok dalam Bahasa Indonesia.\n\n' +
    'Ide video: ' + (o.ide || '') + '\n' +
    'Durasi: ' + d[2] + '\n' +
    'Gaya: ' + g[2] + '\n\n' +
    'Naskahnya berisi: kalimat pembuka yang langsung menarik perhatian dalam 3 detik pertama, isi yang padat, dan penutup dengan ajakan. ' +
    'Sertakan juga saran teks yang tampil di layar. ' +
    'Jawab HANYA dengan naskahnya, tanpa penjelasan tambahan.';
}

export function render(root) {
  const puter = utils.puter.panel();
  root.appendChild(puter.box);
  puter.refresh();

  let alive = true, busy = false, lastHasil = '';
  T.onLeave(() => { alive = false; });

  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Tulis idemu, pilih durasi dan gayanya, dan AI akan menyusun naskah TikTok lengkap dengan pembuka yang menarik. Diproses lewat <b>akun Puter milikmu</b> (login gratis, sekali saja). Teksmu tidak disimpan di mana pun.</p>'));

  /* ---------- Input ---------- */
  const ideTa = T.ta(3, 'Idemu…\nContoh: Tunjukkan cara melipat baju dengan cepat, targetnya anak kos.');
  ideTa.maxLength = MAX_IDE;
  const hitung = T.el('<div class="dim" style="font-size:11.5px;text-align:right;margin-top:2px">0 / ' + MAX_IDE + '</div>');
  ideTa.addEventListener('input', () => { hitung.textContent = ideTa.value.length + ' / ' + MAX_IDE; });
  root.appendChild(T.field('Ide video', ideTa));
  root.appendChild(hitung);

  const durasiSel = T.select(DURASI.map(([v, l]) => [v, l]), '30');
  root.appendChild(T.field('Durasi video', durasiSel));

  const gayaSel = T.select(GAYA.map(([v, l]) => [v, l]), 'lucu');
  root.appendChild(T.field('Gaya video', gayaSel));

  const statusBox = T.el('<div class="dim" style="font-size:12.5px;margin:8px 0;min-height:18px" role="status" aria-live="polite"></div>');
  const setStatus = (t, cls) => { if (alive) statusBox.innerHTML = t ? '<span class="' + (cls || '') + '">' + t + '</span>' : ''; };

  const out = T.out();

  function tampilHasil(teks, detik) {
    lastHasil = teks;
    T.show(out,
      '<div style="border:1px solid #ffffff20;border-radius:10px;padding:12px">' +
      '<div style="font-weight:700;font-size:13px;margin-bottom:6px">Hasil naskah TikTok</div>' +
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
    const ide = ideTa.value.trim();
    if (ide.length < 10) { setStatus('Tulis idemu sedikit lebih lengkap (minimal 10 huruf).', 'err'); ideTa.focus(); return; }
    await puter.need(async () => {
      busy = true; aksiBtn.disabled = true; aksiBtn.textContent = 'AI sedang menulis…';
      setStatus('AI sedang menyusun naskahmu…', '');
      T.show(out, '<div class="dim center" style="padding:18px 0">Menunggu jawaban AI…</div>');
      const t0 = performance.now();
      try {
        const prompt = buatPrompt({ ide, durasi: durasiSel.value, gaya: gayaSel.value });
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
