import { h as T, utils } from '../../core.js';

export const meta = {"id":"penulis-cold-email","name":"Penulis Cold Email","cat":"bisnis","icon":"✉️","desc":"Email penawaran yang sopan dan efektif untuk calon pelanggan baru.","keywords":"cold email,email,penawaran,bisnis,ai,puter","since":"6.18.0", "online": true};

const MAX_PRODUK = 2000;
const TUJUAN = [
  ['kenalan', 'Kenalan dulu', 'memperkenalkan diri dan produk, tanpa memaksa balasan'],
  ['obrolan', 'Jadwalkan obrolan singkat', 'mengajak penerima untuk obrolan singkat 15 menit'],
  ['balasan', 'Minta balasan', 'meminta penerima membalas email ini bila tertarik'],
];
const NADA = [
  ['formal', 'Sopan formal', 'sopan dan formal'],
  ['ramah', 'Ramah santai', 'ramah dan santai, tetap sopan'],
];

// Ekstrak teks dari respons puter.ai.chat (bentuknya bisa string / objek).
// chatText, errPesan kanonis tinggal di utils (core.js).

// Pembentuk prompt murni (bisa diuji tanpa SDK).
export function buatPrompt(o) {
  const t = TUJUAN.find(([v]) => v === (o && o.tujuan)) || TUJUAN[0];
  const n = NADA.find(([v]) => v === (o && o.nada)) || NADA[0];
  return 'Tuliskan cold email (email penawaran pertama ke orang yang belum dikenal) dalam Bahasa Indonesia.\n\n' +
    'Penerima: ' + (o.penerima || '') + '\n' +
    'Produk atau layanan yang ditawarkan: ' + (o.produk || '') + '\n\n' +
    'Tujuan email ini: ' + t[2] + '. Gaya bahasanya ' + n[2] + '. ' +
    'Emailnya singkat (maksimal 150 kata), langsung ke intinya, dan punya subjek email di baris pertama. ' +
    'Jawab HANYA dengan isi emailnya, tanpa penjelasan tambahan.';
}

export function render(root) {
  const puter = utils.puter.panel();
  root.appendChild(puter.box);
  puter.refresh();

  let alive = true, busy = false, lastHasil = '';
  T.onLeave(() => { alive = false; });

  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Tulis siapa penerimanya dan apa yang kamu tawarkan, dan AI akan menyusun email penawaran pertama yang sopan dan singkat. Diproses lewat <b>akun Puter milikmu</b> (login gratis, sekali saja). Teksmu tidak disimpan di mana pun.</p>'));

  /* ---------- Input ---------- */
  const penerimaInp = T.input('text', 'Contoh: Manajer PT Maju Bersama, pemilik toko Roti Enak');
  penerimaInp.maxLength = 100;
  root.appendChild(T.field('Penerima email', penerimaInp));

  const produkTa = T.ta(3, 'Apa yang kamu tawarkan? Contoh: Jasa pembuatan website toko online, harga mulai 2 juta, selesai dalam 2 minggu.');
  produkTa.maxLength = MAX_PRODUK;
  const hitung = T.el('<div class="dim" style="font-size:11.5px;text-align:right;margin-top:2px">0 / ' + MAX_PRODUK + '</div>');
  produkTa.addEventListener('input', () => { hitung.textContent = produkTa.value.length + ' / ' + MAX_PRODUK; });
  root.appendChild(T.field('Produk atau layanan', produkTa));
  root.appendChild(hitung);

  const tujuanSel = T.select(TUJUAN.map(([v, l]) => [v, l]), 'kenalan');
  root.appendChild(T.field('Tujuan email', tujuanSel));

  const nadaSel = T.select(NADA.map(([v, l]) => [v, l]), 'formal');
  root.appendChild(T.field('Nada email', nadaSel));

  const statusBox = T.el('<div class="dim" style="font-size:12.5px;margin:8px 0;min-height:18px" role="status" aria-live="polite"></div>');
  const setStatus = (t, cls) => { if (alive) statusBox.innerHTML = t ? '<span class="' + (cls || '') + '">' + t + '</span>' : ''; };

  const out = T.out();

  function tampilHasil(teks, detik) {
    lastHasil = teks;
    T.show(out,
      '<div style="border:1px solid #ffffff20;border-radius:10px;padding:12px">' +
      '<div style="font-weight:700;font-size:13px;margin-bottom:6px">Hasil cold email</div>' +
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
    const penerima = penerimaInp.value.trim();
    const produk = produkTa.value.trim();
    if (penerima.length < 2) { setStatus('Tulis dulu siapa penerimanya.', 'err'); penerimaInp.focus(); return; }
    if (produk.length < 10) { setStatus('Ceritakan tawaranmu sedikit lebih lengkap (minimal 10 huruf).', 'err'); produkTa.focus(); return; }
    await puter.need(async () => {
      busy = true; aksiBtn.disabled = true; aksiBtn.textContent = 'AI sedang menulis…';
      setStatus('AI sedang menyusun emailmu…', '');
      T.show(out, '<div class="dim center" style="padding:18px 0">Menunggu jawaban AI…</div>');
      const t0 = performance.now();
      try {
        const prompt = buatPrompt({ penerima, produk, tujuan: tujuanSel.value, nada: nadaSel.value });
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
        if (alive) { busy = false; aksiBtn.disabled = false; aksiBtn.textContent = 'Tulis Email'; }
      }
    });
  }

  const aksiBtn = T.btn('Tulis Email', () => jalan(), true);
  root.appendChild(T.el('<div style="height:8px"></div>'));
  root.appendChild(T.row(aksiBtn));
  root.appendChild(statusBox);
  root.appendChild(out);
  root.appendChild(T.el(utils.puter.poweredBy()));
}
