import { h as T, utils } from '../../core.js';

export const meta = {"id":"parafrase-teks-ai","name":"Parafrase Teks AI","cat":"teks","icon":"🔄","desc":"Tulis ulang teks dengan kalimat berbeda, makna sama.","keywords":"parafrase,tulis ulang,teks,ai,puter","since":"6.18.0"};

const MAX_TEKS = 5000;
const TINGKAT = [
  ['ringan', 'Ringan', 'ringan: ganti beberapa kata dan susunan kalimat saja'],
  ['sedang', 'Sedang', 'sedang: susun ulang kalimatnya dengan kata-kata yang berbeda'],
  ['menyeluruh', 'Menyeluruh', 'menyeluruh: tulis ulang total dengan struktur kalimat yang baru'],
];

// Ekstrak teks dari respons puter.ai.chat (bentuknya bisa string / objek).
// chatText, errPesan kanonis tinggal di utils (core.js).

// Pembentuk prompt murni (bisa diuji tanpa SDK).
export function buatPrompt(o) {
  const t = TINGKAT.find(([v]) => v === (o && o.tingkat)) || TINGKAT[1];
  return 'Parafrase teks berikut ini secara ' + t[2] + '. ' +
    'Pertahankan arti, fakta, dan angka aslinya. Pertahankan jumlah paragrafnya. ' +
    'Jawab HANYA dengan hasil parafarsenya, tanpa penjelasan tambahan.\n\nTeks:\n' + (o.teks || '');
}

export function render(root) {
  const puter = utils.puter.panel();
  root.appendChild(puter.box);
  puter.refresh();

  let alive = true, busy = false, lastHasil = '';
  T.onLeave(() => { alive = false; });

  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Tempel teksmu, pilih seberapa jauh diubah, dan AI akan menulis ulangnya dengan kalimat berbeda tapi makna yang sama. Cocok untuk teks panjang sampai beberapa paragraf. Diproses lewat <b>akun Puter milikmu</b> (login gratis, sekali saja). Teksmu tidak disimpan di mana pun.</p>'));

  /* ---------- Input ---------- */
  const ta = T.ta(6, 'Tempel teksmu di sini…\nContoh: Membaca buku setiap hari membantu kita memperluas wawasan dan melatih kemampuan berpikir. Selain itu, membaca juga bisa menjadi cara yang baik untuk bersantai setelah seharian bekerja.');
  ta.maxLength = MAX_TEKS;
  const hitung = T.el('<div class="dim" style="font-size:11.5px;text-align:right;margin-top:2px">0 / ' + MAX_TEKS + '</div>');
  ta.addEventListener('input', () => { hitung.textContent = ta.value.length + ' / ' + MAX_TEKS; });
  root.appendChild(T.field('Teks yang diparafrase', ta));
  root.appendChild(hitung);

  const tingkatSel = T.select(TINGKAT.map(([v, l]) => [v, l]), 'sedang');
  root.appendChild(T.field('Tingkat perubahan', tingkatSel));

  const statusBox = T.el('<div class="dim" style="font-size:12.5px;margin:8px 0;min-height:18px" role="status" aria-live="polite"></div>');
  const setStatus = (t, cls) => { if (alive) statusBox.innerHTML = t ? '<span class="' + (cls || '') + '">' + t + '</span>' : ''; };

  const out = T.out();

  function tampilHasil(teks, detik) {
    lastHasil = teks;
    T.show(out,
      '<div style="border:1px solid #ffffff20;border-radius:10px;padding:12px">' +
      '<div style="font-weight:700;font-size:13px;margin-bottom:6px">Hasil parafrase</div>' +
      '<div style="font-size:14px;line-height:1.7;white-space:pre-wrap;word-break:break-word">' + T.esc(teks) + '</div>' +
      '</div>');
    const row = T.el('<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px"></div>');
    row.appendChild(T.copyBtn(() => lastHasil, 'Salin hasil'));
    row.appendChild(T.btn('Parafrase lagi', () => jalan()));
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
    const teks = ta.value.trim();
    if (teks.length < 10) { setStatus('Tulis dulu teksnya (minimal 10 huruf).', 'err'); ta.focus(); return; }
    await puter.need(async () => {
      busy = true; aksiBtn.disabled = true; aksiBtn.textContent = 'AI sedang menulis…';
      setStatus('AI sedang memparafrase teksmu…', '');
      T.show(out, '<div class="dim center" style="padding:18px 0">Menunggu jawaban AI…</div>');
      const t0 = performance.now();
      try {
        const prompt = buatPrompt({ teks, tingkat: tingkatSel.value });
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
        if (alive) { busy = false; aksiBtn.disabled = false; aksiBtn.textContent = 'Parafrase'; }
      }
    });
  }

  const aksiBtn = T.btn('Parafrase', () => jalan(), true);
  root.appendChild(T.el('<div style="height:8px"></div>'));
  root.appendChild(T.row(aksiBtn));
  root.appendChild(statusBox);
  root.appendChild(out);
  root.appendChild(T.el(utils.puter.poweredBy()));
}
