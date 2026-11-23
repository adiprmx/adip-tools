import { h as T, utils } from '../../core.js';

export const meta = {"id":"generator-headline-iklan-fb","name":"Generator Headline Iklan FB","cat":"bisnis","icon":"📣","desc":"Judul iklan Facebook yang menarik klik.","keywords":"headline,iklan,facebook,fb,judul,ai,puter","since":"6.18.0", "online": true};

const MAX_KEUNGGULAN = 2000;
const JUMLAH = [
  ['3', '3 headline', '3'],
  ['5', '5 headline', '5'],
  ['8', '8 headline', '8'],
];

// Ekstrak teks dari respons puter.ai.chat (bentuknya bisa string / objek).
// chatText, errPesan kanonis tinggal di utils (core.js).

// Pembentuk prompt murni (bisa diuji tanpa SDK).
export function buatPrompt(o) {
  const j = JUMLAH.find(([v]) => v === (o && o.jumlah)) || JUMLAH[1];
  return 'Buatkan ' + j[2] + ' headline iklan Facebook dalam Bahasa Indonesia untuk produk berikut.\n\n' +
    'Produk: ' + (o.produk || '') + '\n' +
    'Keunggulan: ' + (o.keunggulan || '') + '\n\n' +
    'Tiap headline maksimal 40 karakter, beda-beda sudutnya, dan bikin orang penasaran untuk klik. ' +
    'Jangan pakai klaim berlebihan yang tidak bisa dibuktikan. ' +
    'Jawab HANYA dengan daftar headlinenya, satu per baris, tanpa penjelasan tambahan.';
}

export function render(root) {
  const puter = utils.puter.panel();
  root.appendChild(puter.box);
  puter.refresh();

  let alive = true, busy = false, lastHasil = '';
  T.onLeave(() => { alive = false; });

  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Tulis produk dan keunggulannya, dan AI akan membuat beberapa pilihan judul iklan Facebook yang menarik klik. Diproses lewat <b>akun Puter milikmu</b> (login gratis, sekali saja). Teksmu tidak disimpan di mana pun.</p>'));

  /* ---------- Input ---------- */
  const produkInp = T.input('text', 'Contoh: Kopi Sore, aplikasi kasir, kursus gitar');
  produkInp.maxLength = 100;
  root.appendChild(T.field('Produk yang diiklankan', produkInp));

  const unggulTa = T.ta(3, 'Apa keunggulan produkmu? Contoh: Harga mulai 15 ribu, diseduh fresh setiap pagi, gratis ongkir untuk Depok.');
  unggulTa.maxLength = MAX_KEUNGGULAN;
  const hitung = T.el('<div class="dim" style="font-size:11.5px;text-align:right;margin-top:2px">0 / ' + MAX_KEUNGGULAN + '</div>');
  unggulTa.addEventListener('input', () => { hitung.textContent = unggulTa.value.length + ' / ' + MAX_KEUNGGULAN; });
  root.appendChild(T.field('Keunggulan produk', unggulTa));
  root.appendChild(hitung);

  const jumlahSel = T.select(JUMLAH.map(([v, l]) => [v, l]), '5');
  root.appendChild(T.field('Jumlah headline', jumlahSel));

  const statusBox = T.el('<div class="dim" style="font-size:12.5px;margin:8px 0;min-height:18px" role="status" aria-live="polite"></div>');
  const setStatus = (t, cls) => { if (alive) statusBox.innerHTML = t ? '<span class="' + (cls || '') + '">' + t + '</span>' : ''; };

  const out = T.out();

  function tampilHasil(teks, detik) {
    lastHasil = teks;
    T.show(out,
      '<div style="border:1px solid #ffffff20;border-radius:10px;padding:12px">' +
      '<div style="font-weight:700;font-size:13px;margin-bottom:6px">Hasil headline iklan</div>' +
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
    const produk = produkInp.value.trim();
    const keunggulan = unggulTa.value.trim();
    if (produk.length < 2) { setStatus('Tulis dulu nama produknya.', 'err'); produkInp.focus(); return; }
    if (keunggulan.length < 10) { setStatus('Tulis keunggulannya sedikit lebih lengkap (minimal 10 huruf).', 'err'); unggulTa.focus(); return; }
    await puter.need(async () => {
      busy = true; aksiBtn.disabled = true; aksiBtn.textContent = 'AI sedang menulis…';
      setStatus('AI sedang membuat headlinenya…', '');
      T.show(out, '<div class="dim center" style="padding:18px 0">Menunggu jawaban AI…</div>');
      const t0 = performance.now();
      try {
        const prompt = buatPrompt({ produk, keunggulan, jumlah: jumlahSel.value });
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
        if (alive) { busy = false; aksiBtn.disabled = false; aksiBtn.textContent = 'Buat Headline'; }
      }
    });
  }

  const aksiBtn = T.btn('Buat Headline', () => jalan(), true);
  root.appendChild(T.el('<div style="height:8px"></div>'));
  root.appendChild(T.row(aksiBtn));
  root.appendChild(statusBox);
  root.appendChild(out);
  root.appendChild(T.el(utils.puter.poweredBy()));
}
