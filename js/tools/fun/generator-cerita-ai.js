import { h as T, utils } from '../../core.js';

export const meta = {"id":"generator-cerita-ai","name":"Generator Cerita AI","cat":"fun","icon":"📖","desc":"Cerita pendek dari tema dan tokoh yang kamu pilih.","keywords":"cerita,dongeng,fiksi,ai,puter","since":"6.18.0", "online": true};

const GENRE = [
  ['petualangan', 'Petualangan', 'petualangan yang seru'],
  ['misteri', 'Misteri', 'misteri yang bikin penasaran'],
  ['lucu', 'Lucu', 'komedi yang ringan dan lucu'],
  ['fantasi', 'Fantasi', 'fantasi dengan dunia dan makhluk ajaib'],
  ['sehari-hari', 'Sehari-hari', 'kehidupan sehari-hari yang hangat'],
];
const PANJANG = [
  ['pendek', 'Pendek (sekitar 300 kata)', 'sekitar 300 kata'],
  ['sedang', 'Sedang (sekitar 600 kata)', 'sekitar 600 kata'],
];

// Ekstrak teks dari respons puter.ai.chat (bentuknya bisa string / objek).
// chatText, errPesan kanonis tinggal di utils (core.js).

// Pembentuk prompt murni (bisa diuji tanpa SDK).
export function buatPrompt(o) {
  const g = GENRE.find(([v]) => v === (o && o.genre)) || GENRE[0];
  const p = PANJANG.find(([v]) => v === (o && o.panjang)) || PANJANG[0];
  return 'Tuliskan cerita pendek dalam Bahasa Indonesia.\n\n' +
    'Tema: ' + (o.tema || '') + '\n' +
    'Tokoh utama: ' + (o.tokoh || 'seseorang') + '\n\n' +
    'Genrenya ' + g[2] + ', panjangnya ' + p[2] + '. Ceritanya punya awal, tengah, dan akhir yang jelas. ' +
    'Jawab HANYA dengan ceritanya, tanpa penjelasan tambahan.';
}

export function render(root) {
  const puter = utils.puter.panel();
  root.appendChild(puter.box);
  puter.refresh();

  let alive = true, busy = false, lastHasil = '';
  T.onLeave(() => { alive = false; });

  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Pilih tema dan tokohnya, dan AI akan menulis cerita pendek untukmu. Diproses lewat <b>akun Puter milikmu</b> (login gratis, sekali saja). Teksmu tidak disimpan di mana pun.</p>'));

  /* ---------- Input ---------- */
  const temaInp = T.input('text', 'Contoh: kucing yang tersesat di pasar malam, robot penjaga perpustakaan');
  temaInp.maxLength = 200;
  root.appendChild(T.field('Tema cerita', temaInp));

  const tokohInp = T.input('text', 'Contoh: Nara, anak 10 tahun yang suka menggambar');
  tokohInp.maxLength = 100;
  root.appendChild(T.field('Tokoh utama', tokohInp));

  const genreSel = T.select(GENRE.map(([v, l]) => [v, l]), 'petualangan');
  root.appendChild(T.field('Genre', genreSel));

  const panjangSel = T.select(PANJANG.map(([v, l]) => [v, l]), 'pendek');
  root.appendChild(T.field('Panjang cerita', panjangSel));

  const statusBox = T.el('<div class="dim" style="font-size:12.5px;margin:8px 0;min-height:18px" role="status" aria-live="polite"></div>');
  const setStatus = (t, cls) => { if (alive) statusBox.innerHTML = t ? '<span class="' + (cls || '') + '">' + t + '</span>' : ''; };

  const out = T.out();

  function tampilHasil(teks, detik) {
    lastHasil = teks;
    T.show(out,
      '<div style="border:1px solid #ffffff20;border-radius:10px;padding:12px">' +
      '<div style="font-weight:700;font-size:13px;margin-bottom:6px">Hasil cerita</div>' +
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
    const tema = temaInp.value.trim();
    const tokoh = tokohInp.value.trim();
    if (tema.length < 3) { setStatus('Tulis dulu temanya (minimal 3 huruf).', 'err'); temaInp.focus(); return; }
    if (tokoh.length < 2) { setStatus('Tulis dulu nama tokohnya.', 'err'); tokohInp.focus(); return; }
    await puter.need(async () => {
      busy = true; aksiBtn.disabled = true; aksiBtn.textContent = 'AI sedang menulis…';
      setStatus('AI sedang menulis ceritamu…', '');
      T.show(out, '<div class="dim center" style="padding:18px 0">Menunggu jawaban AI…</div>');
      const t0 = performance.now();
      try {
        const prompt = buatPrompt({ tema, tokoh, genre: genreSel.value, panjang: panjangSel.value });
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
        if (alive) { busy = false; aksiBtn.disabled = false; aksiBtn.textContent = 'Buat Cerita'; }
      }
    });
  }

  const aksiBtn = T.btn('Buat Cerita', () => jalan(), true);
  root.appendChild(T.el('<div style="height:8px"></div>'));
  root.appendChild(T.row(aksiBtn));
  root.appendChild(statusBox);
  root.appendChild(out);
  root.appendChild(T.el(utils.puter.poweredBy()));
}
