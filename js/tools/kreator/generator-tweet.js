import { h as T, utils } from '../../core.js';

export const meta = {"id":"generator-tweet","name":"Generator Tweet","cat":"kreator","icon":"🐦","desc":"Tweet singkat dan menarik dari topikmu.","keywords":"tweet,x,twitter,sosial,ai,puter","since":"6.18.0"};

const MAX_TOPIK = 2000;
const GAYA = [
  ['lucu', 'Lucu', 'lucu dan ringan'],
  ['serius', 'Serius', 'serius dan langsung ke intinya'],
  ['inspiratif', 'Inspiratif', 'inspiratif dan menyemangati'],
  ['santai', 'Santai', 'santai seperti sedang ngobrol'],
];
const JUMLAH = [
  ['3', '3 tweet', '3'],
  ['5', '5 tweet', '5'],
];

// Ekstrak teks dari respons puter.ai.chat (bentuknya bisa string / objek).
// chatText, errPesan kanonis tinggal di utils (core.js).

// Pembentuk prompt murni (bisa diuji tanpa SDK).
export function buatPrompt(o) {
  const g = GAYA.find(([v]) => v === (o && o.gaya)) || GAYA[0];
  const j = JUMLAH.find(([v]) => v === (o && o.jumlah)) || JUMLAH[0];
  return 'Buatkan ' + j[2] + ' tweet dalam Bahasa Indonesia dari topik berikut.\n\n' +
    'Topik atau pesan: ' + (o.topik || '') + '\n\n' +
    'Gayanya ' + g[2] + '. Tiap tweet maksimal 280 karakter, beda-beda sudutnya, dan enak dibaca. ' +
    'Jawab HANYA dengan daftar tweetnya, satu per baris, tanpa penjelasan tambahan.';
}

export function render(root) {
  const puter = utils.puter.panel();
  root.appendChild(puter.box);
  puter.refresh();

  let alive = true, busy = false, lastHasil = '';
  T.onLeave(() => { alive = false; });

  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Tulis topik atau pesanmu, dan AI akan membuat beberapa pilihan tweet singkat yang siap diposting. Diproses lewat <b>akun Puter milikmu</b> (login gratis, sekali saja). Teksmu tidak disimpan di mana pun.</p>'));

  /* ---------- Input ---------- */
  const topikTa = T.ta(3, 'Topik atau pesanmu…\nContoh: Pentingnya tidur cukup buat yang kerja di depan laptop seharian.');
  topikTa.maxLength = MAX_TOPIK;
  const hitung = T.el('<div class="dim" style="font-size:11.5px;text-align:right;margin-top:2px">0 / ' + MAX_TOPIK + '</div>');
  topikTa.addEventListener('input', () => { hitung.textContent = topikTa.value.length + ' / ' + MAX_TOPIK; });
  root.appendChild(T.field('Topik atau pesan', topikTa));
  root.appendChild(hitung);

  const gayaSel = T.select(GAYA.map(([v, l]) => [v, l]), 'lucu');
  root.appendChild(T.field('Gaya tweet', gayaSel));

  const jumlahSel = T.select(JUMLAH.map(([v, l]) => [v, l]), '3');
  root.appendChild(T.field('Jumlah tweet', jumlahSel));

  const statusBox = T.el('<div class="dim" style="font-size:12.5px;margin:8px 0;min-height:18px" role="status" aria-live="polite"></div>');
  const setStatus = (t, cls) => { if (alive) statusBox.innerHTML = t ? '<span class="' + (cls || '') + '">' + t + '</span>' : ''; };

  const out = T.out();

  function tampilHasil(teks, detik) {
    lastHasil = teks;
    T.show(out,
      '<div style="border:1px solid #ffffff20;border-radius:10px;padding:12px">' +
      '<div style="font-weight:700;font-size:13px;margin-bottom:6px">Hasil tweet</div>' +
      '<div style="font-size:14px;line-height:1.7;white-space:pre-wrap;word-break:break-word">' + T.esc(teks) + '</div>' +
      '</div>');
    const row = T.el('<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px"></div>');
    row.appendChild(T.copyBtn(() => lastHasil, 'Salin hasil'));
    row.appendChild(T.btn('Buat lagi', () => jalan()));
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
    const topik = topikTa.value.trim();
    if (topik.length < 10) { setStatus('Tulis topiknya sedikit lebih lengkap (minimal 10 huruf).', 'err'); topikTa.focus(); return; }
    await puter.need(async () => {
      busy = true; aksiBtn.disabled = true; aksiBtn.textContent = 'AI sedang menulis…';
      setStatus('AI sedang membuat tweetnya…', '');
      T.show(out, '<div class="dim center" style="padding:18px 0">Menunggu jawaban AI…</div>');
      const t0 = performance.now();
      try {
        const prompt = buatPrompt({ topik, gaya: gayaSel.value, jumlah: jumlahSel.value });
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
        if (alive) { busy = false; aksiBtn.disabled = false; aksiBtn.textContent = 'Buat Tweet'; }
      }
    });
  }

  const aksiBtn = T.btn('Buat Tweet', () => jalan(), true);
  root.appendChild(T.el('<div style="height:8px"></div>'));
  root.appendChild(T.row(aksiBtn));
  root.appendChild(statusBox);
  root.appendChild(out);
  root.appendChild(T.el(utils.puter.poweredBy()));
}
