import { h as T, utils } from '../../core.js';

export const meta = {"id":"generator-faq","name":"Generator FAQ","cat":"bisnis","icon":"❓","desc":"Daftar pertanyaan umum dan jawabannya dari topik bisnismu.","keywords":"faq,pertanyaan,jawaban,bisnis,ai,puter","since":"6.18.0"};

const MAX_TOPIK = 2000;
const JUMLAH = [
  ['3', '3 pertanyaan', '3'],
  ['5', '5 pertanyaan', '5'],
  ['8', '8 pertanyaan', '8'],
];

// Ekstrak teks dari respons puter.ai.chat (bentuknya bisa string / objek).
// chatText, errPesan kanonis tinggal di utils (core.js).

// Pembentuk prompt murni (bisa diuji tanpa SDK).
export function buatPrompt(o) {
  const j = JUMLAH.find(([v]) => v === (o && o.jumlah)) || JUMLAH[1];
  return 'Buatkan daftar FAQ (pertanyaan yang sering ditanyakan beserta jawabannya) dalam Bahasa Indonesia untuk topik berikut.\n\n' +
    'Topik: ' + (o.topik || '') + '\n\n' +
    'Buat ' + j[2] + ' pertanyaan yang paling mungkin ditanyakan pelanggan, dengan jawaban singkat dan jelas untuk tiap pertanyaan. ' +
    'Jawab HANYA dengan daftar FAQ-nya, tanpa penjelasan tambahan.';
}

export function render(root) {
  const puter = utils.puter.panel();
  root.appendChild(puter.box);
  puter.refresh();

  let alive = true, busy = false, lastHasil = '';
  T.onLeave(() => { alive = false; });

  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Ceritakan bisnismu, dan AI akan menyusun daftar pertanyaan yang sering ditanyakan pelanggan beserta jawabannya. Diproses lewat <b>akun Puter milikmu</b> (login gratis, sekali saja). Teksmu tidak disimpan di mana pun.</p>'));

  /* ---------- Input ---------- */
  const topikTa = T.ta(4, 'Ceritakan bisnismu di sini…\nContoh: Kedai kopi di Depok, buka setiap hari jam 8 pagi sampai 10 malam. Jual kopi susu, matcha, dan roti. Bisa pesan antar lewat aplikasi ojek online.');
  topikTa.maxLength = MAX_TOPIK;
  const hitung = T.el('<div class="dim" style="font-size:11.5px;text-align:right;margin-top:2px">0 / ' + MAX_TOPIK + '</div>');
  topikTa.addEventListener('input', () => { hitung.textContent = topikTa.value.length + ' / ' + MAX_TOPIK; });
  root.appendChild(T.field('Topik bisnismu', topikTa));
  root.appendChild(hitung);

  const jumlahSel = T.select(JUMLAH.map(([v, l]) => [v, l]), '5');
  root.appendChild(T.field('Jumlah pertanyaan', jumlahSel));

  const statusBox = T.el('<div class="dim" style="font-size:12.5px;margin:8px 0;min-height:18px" role="status" aria-live="polite"></div>');
  const setStatus = (t, cls) => { if (alive) statusBox.innerHTML = t ? '<span class="' + (cls || '') + '">' + t + '</span>' : ''; };

  const out = T.out();

  function tampilHasil(teks, detik) {
    lastHasil = teks;
    T.show(out,
      '<div style="border:1px solid #ffffff20;border-radius:10px;padding:12px">' +
      '<div style="font-weight:700;font-size:13px;margin-bottom:6px">Hasil FAQ</div>' +
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
    if (topik.length < 10) { setStatus('Ceritakan bisnismu sedikit lebih lengkap (minimal 10 huruf).', 'err'); topikTa.focus(); return; }
    await puter.need(async () => {
      busy = true; aksiBtn.disabled = true; aksiBtn.textContent = 'AI sedang menulis…';
      setStatus('AI sedang menyusun daftar FAQ-mu…', '');
      T.show(out, '<div class="dim center" style="padding:18px 0">Menunggu jawaban AI…</div>');
      const t0 = performance.now();
      try {
        const prompt = buatPrompt({ topik, jumlah: jumlahSel.value });
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
        if (alive) { busy = false; aksiBtn.disabled = false; aksiBtn.textContent = 'Buat FAQ'; }
      }
    });
  }

  const aksiBtn = T.btn('Buat FAQ', () => jalan(), true);
  root.appendChild(T.el('<div style="height:8px"></div>'));
  root.appendChild(T.row(aksiBtn));
  root.appendChild(statusBox);
  root.appendChild(out);
  root.appendChild(T.el(utils.puter.poweredBy()));
}
