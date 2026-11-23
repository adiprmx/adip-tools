import { h as T, utils } from '../../core.js';

export const meta = {"id":"penulis-naskah-podcast-ai","name":"Penulis Naskah Podcast AI","cat":"kreator","icon":"🎙️","desc":"Naskah episode podcast dari topik dan durasi.","keywords":"podcast,naskah,episode,audio,ai,puter","since":"6.18.0", "online": true};

const DURASI = [
  ['5', 'Sekitar 5 menit', 'sekitar 5 menit'],
  ['10', 'Sekitar 10 menit', 'sekitar 10 menit'],
  ['15', 'Sekitar 15 menit', 'sekitar 15 menit'],
];
const FORMAT = [
  ['obrolan', 'Obrolan santai (2 host)', 'obrolan santai dua host yang saling menanggapi'],
  ['wawancara', 'Wawancara', 'wawancara, host bertanya dan narasumber menjawab'],
  ['solo', 'Solo (1 host)', 'monolog satu host yang bercerita langsung ke pendengar'],
];

// Ekstrak teks dari respons puter.ai.chat (bentuknya bisa string / objek).
// chatText, errPesan kanonis tinggal di utils (core.js).

// Pembentuk prompt murni (bisa diuji tanpa SDK).
export function buatPrompt(o) {
  const d = DURASI.find(([v]) => v === (o && o.durasi)) || DURASI[1];
  const f = FORMAT.find(([v]) => v === (o && o.format)) || FORMAT[0];
  return 'Tuliskan naskah episode podcast dalam Bahasa Indonesia.\n\n' +
    'Topik: ' + (o.topik || '') + '\n' +
    'Durasi: ' + d[2] + '\n' +
    'Format: ' + f[2] + '\n\n' +
    'Naskahnya enak dibacakan, dengan pembuka, isi, dan penutup. Tiap pembicara diberi nama peran yang jelas. ' +
    'Jawab HANYA dengan naskahnya, tanpa penjelasan tambahan.';
}

export function render(root) {
  const puter = utils.puter.panel();
  root.appendChild(puter.box);
  puter.refresh();

  let alive = true, busy = false, lastHasil = '';
  T.onLeave(() => { alive = false; });

  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Tulis topik episodenya, pilih durasi dan formatnya, dan AI akan menyusun naskah yang enak dibacakan. Diproses lewat <b>akun Puter milikmu</b> (login gratis, sekali saja). Teksmu tidak disimpan di mana pun.</p>'));

  /* ---------- Input ---------- */
  const topikInp = T.input('text', 'Contoh: Kenapa tidur cukup itu penting, awal mula kopi di Indonesia');
  topikInp.maxLength = 200;
  root.appendChild(T.field('Topik episode', topikInp));

  const durasiSel = T.select(DURASI.map(([v, l]) => [v, l]), '10');
  root.appendChild(T.field('Durasi episode', durasiSel));

  const formatSel = T.select(FORMAT.map(([v, l]) => [v, l]), 'obrolan');
  root.appendChild(T.field('Format episode', formatSel));

  const statusBox = T.el('<div class="dim" style="font-size:12.5px;margin:8px 0;min-height:18px" role="status" aria-live="polite"></div>');
  const setStatus = (t, cls) => { if (alive) statusBox.innerHTML = t ? '<span class="' + (cls || '') + '">' + t + '</span>' : ''; };

  const out = T.out();

  function tampilHasil(teks, detik) {
    lastHasil = teks;
    T.show(out,
      '<div style="border:1px solid #ffffff20;border-radius:10px;padding:12px">' +
      '<div style="font-weight:700;font-size:13px;margin-bottom:6px">Hasil naskah podcast</div>' +
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
        const prompt = buatPrompt({ topik, durasi: durasiSel.value, format: formatSel.value });
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
