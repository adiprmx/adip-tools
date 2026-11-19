import { h as T, utils } from '../../core.js';

export const meta = {"id":"generator-copy-landing-page","name":"Generator Copy Landing Page","cat":"bisnis","icon":"🛍️","desc":"Teks landing page yang menjual dari deskripsi produkmu.","keywords":"landing page,copy,iklan,jualan,produk,ai,puter","since":"6.18.0"};

const MAX_DESKRIPSI = 2000;
const GAYA = [
  ['meyakinkan', 'Meyakinkan', 'dengan gaya meyakinkan yang mendorong pembaca untuk mencoba'],
  ['santai', 'Santai', 'dengan gaya santai seperti sedang ngobrol dengan teman'],
  ['profesional', 'Profesional', 'dengan gaya profesional dan rapi'],
];

// Ekstrak teks dari respons puter.ai.chat (bentuknya bisa string / objek).
// chatText, errPesan kanonis tinggal di utils (core.js).

// Pembentuk prompt murni (bisa diuji tanpa SDK).
export function buatPrompt(o) {
  const g = GAYA.find(([v]) => v === (o && o.gaya)) || GAYA[0];
  return 'Buatkan teks landing page dalam Bahasa Indonesia untuk produk berikut.\n\n' +
    'Produk: ' + (o.produk || '') + '\n' +
    'Deskripsi: ' + (o.deskripsi || '') + '\n' +
    'Pembeli yang dituju: ' + (o.audiens || 'umum') + '\n\n' +
    'Tulis ' + g[2] + '. Susun jadi: judul utama, penjelasan singkat, 3 keunggulan, dan ajakan mencoba di akhir. ' +
    'Jawab HANYA dengan teks landing pagenya, tanpa penjelasan tambahan.';
}

export function render(root) {
  const puter = utils.puter.panel();
  root.appendChild(puter.box);
  puter.refresh();

  let alive = true, busy = false, lastHasil = '';
  T.onLeave(() => { alive = false; });

  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Ceritakan produkmu, dan AI akan menyusun teks landing page yang siap dipakai. Diproses lewat <b>akun Puter milikmu</b> (login gratis, sekali saja). Teksmu tidak disimpan di mana pun.</p>'));

  /* ---------- Input ---------- */
  const namaInp = T.input('text', 'Contoh: Kopi Sore, aplikasi kasir, kursus gitar');
  namaInp.maxLength = 100;
  root.appendChild(T.field('Nama produk', namaInp));

  const deskTa = T.ta(3, 'Apa yang dijual dan kenapa orang butuh? Contoh: Kopi susu gula aren kemasan 250ml, diseduh fresh setiap pagi, dikirim dingin ke seluruh Depok.');
  deskTa.maxLength = MAX_DESKRIPSI;
  const hitung = T.el('<div class="dim" style="font-size:11.5px;text-align:right;margin-top:2px">0 / ' + MAX_DESKRIPSI + '</div>');
  deskTa.addEventListener('input', () => { hitung.textContent = deskTa.value.length + ' / ' + MAX_DESKRIPSI; });
  root.appendChild(T.field('Deskripsi produk', deskTa));
  root.appendChild(hitung);

  const audiensInp = T.input('text', 'Contoh: pekerja kantoran, ibu rumah tangga, pelajar');
  audiensInp.maxLength = 100;
  root.appendChild(T.field('Siapa pembelinya', audiensInp));

  const gayaSel = T.select(GAYA.map(([v, l]) => [v, l]), 'meyakinkan');
  root.appendChild(T.field('Gaya penulisan', gayaSel));

  const statusBox = T.el('<div class="dim" style="font-size:12.5px;margin:8px 0;min-height:18px" role="status" aria-live="polite"></div>');
  const setStatus = (t, cls) => { if (alive) statusBox.innerHTML = t ? '<span class="' + (cls || '') + '">' + t + '</span>' : ''; };

  const out = T.out();

  function tampilHasil(teks, detik) {
    lastHasil = teks;
    T.show(out,
      '<div style="border:1px solid #ffffff20;border-radius:10px;padding:12px">' +
      '<div style="font-weight:700;font-size:13px;margin-bottom:6px">Hasil copy landing page</div>' +
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
    const produk = namaInp.value.trim();
    const deskripsi = deskTa.value.trim();
    if (produk.length < 2) { setStatus('Tulis dulu nama produknya.', 'err'); namaInp.focus(); return; }
    if (deskripsi.length < 10) { setStatus('Ceritakan produkmu sedikit lebih lengkap (minimal 10 huruf).', 'err'); deskTa.focus(); return; }
    await puter.need(async () => {
      busy = true; aksiBtn.disabled = true; aksiBtn.textContent = 'AI sedang menulis…';
      setStatus('AI sedang menyusun teks landing pagemu…', '');
      T.show(out, '<div class="dim center" style="padding:18px 0">Menunggu jawaban AI…</div>');
      const t0 = performance.now();
      try {
        const prompt = buatPrompt({ produk, deskripsi, audiens: audiensInp.value.trim(), gaya: gayaSel.value });
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
        if (alive) { busy = false; aksiBtn.disabled = false; aksiBtn.textContent = 'Buat Copy'; }
      }
    });
  }

  const aksiBtn = T.btn('Buat Copy', () => jalan(), true);
  root.appendChild(T.el('<div style="height:8px"></div>'));
  root.appendChild(T.row(aksiBtn));
  root.appendChild(statusBox);
  root.appendChild(out);
  root.appendChild(T.el(utils.puter.poweredBy()));
}
