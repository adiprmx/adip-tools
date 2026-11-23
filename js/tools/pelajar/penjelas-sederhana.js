import { h as T, utils } from '../../core.js';

export const meta = {"id":"penjelas-sederhana","name":"Penjelas Sederhana","cat":"pelajar","icon":"💡","desc":"Jelaskan topik rumit dengan bahasa yang mudah dipahami.","keywords":"penjelas,sederhana,belajar,topik,ai,puter","since":"6.18.0", "online": true};

const MAX_TOPIK = 2000;
const LEVEL = [
  ['sd', 'Anak SD', 'anak SD yang baru pertama kali dengar'],
  ['remaja', 'Remaja', 'remaja yang sudah tahu dasar-dasarnya'],
  ['dewasa', 'Dewasa', 'orang dewasa tanpa latar belakang khusus di bidang ini'],
];

// Ekstrak teks dari respons puter.ai.chat (bentuknya bisa string / objek).
// chatText, errPesan kanonis tinggal di utils (core.js).

// Pembentuk prompt murni (bisa diuji tanpa SDK).
export function buatPrompt(o) {
  const l = LEVEL.find(([v]) => v === (o && o.level)) || LEVEL[1];
  return 'Jelaskan topik berikut dalam Bahasa Indonesia dengan bahasa yang sederhana, seolah menjelaskan ke ' + l[2] + '.\n\n' +
    'Topik: ' + (o.topik || '') + '\n\n' +
    'Pakai contoh dari kehidupan sehari-hari. Hindari istilah teknis, dan kalau terpaksa memakai satu, jelaskan artinya dengan kata-kata biasa. ' +
    'Jawab HANYA dengan penjelasannya, tanpa penjelasan tambahan.';
}

export function render(root) {
  const puter = utils.puter.panel();
  root.appendChild(puter.box);
  puter.refresh();

  let alive = true, busy = false, lastHasil = '';
  T.onLeave(() => { alive = false; });

  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Tulis topik yang membingungkan, dan AI akan menjelaskannya dengan bahasa yang gampang dipahami, lengkap dengan contoh sehari-hari. Diproses lewat <b>akun Puter milikmu</b> (login gratis, sekali saja). Teksmu tidak disimpan di mana pun.</p>'));

  /* ---------- Input ---------- */
  const topikTa = T.ta(3, 'Topik yang mau dijelaskan…\nContoh: Kenapa langit warnanya biru? Apa itu inflasi?');
  topikTa.maxLength = MAX_TOPIK;
  const hitung = T.el('<div class="dim" style="font-size:11.5px;text-align:right;margin-top:2px">0 / ' + MAX_TOPIK + '</div>');
  topikTa.addEventListener('input', () => { hitung.textContent = topikTa.value.length + ' / ' + MAX_TOPIK; });
  root.appendChild(T.field('Topiknya', topikTa));
  root.appendChild(hitung);

  const levelSel = T.select(LEVEL.map(([v, l]) => [v, l]), 'remaja');
  root.appendChild(T.field('Dijelaskan untuk siapa', levelSel));

  const statusBox = T.el('<div class="dim" style="font-size:12.5px;margin:8px 0;min-height:18px" role="status" aria-live="polite"></div>');
  const setStatus = (t, cls) => { if (alive) statusBox.innerHTML = t ? '<span class="' + (cls || '') + '">' + t + '</span>' : ''; };

  const out = T.out();

  function tampilHasil(teks, detik) {
    lastHasil = teks;
    T.show(out,
      '<div style="border:1px solid #ffffff20;border-radius:10px;padding:12px">' +
      '<div style="font-weight:700;font-size:13px;margin-bottom:6px">Hasil penjelasan</div>' +
      '<div style="font-size:14px;line-height:1.7;white-space:pre-wrap;word-break:break-word">' + T.esc(teks) + '</div>' +
      '</div>');
    const row = T.el('<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px"></div>');
    row.appendChild(T.copyBtn(() => lastHasil, 'Salin hasil'));
    row.appendChild(T.btn('Jelaskan lagi', () => jalan()));
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
    if (topik.length < 3) { setStatus('Tulis dulu topiknya (minimal 3 huruf).', 'err'); topikTa.focus(); return; }
    await puter.need(async () => {
      busy = true; aksiBtn.disabled = true; aksiBtn.textContent = 'AI sedang menjelaskan…';
      setStatus('AI sedang menyiapkan penjelasanmu…', '');
      T.show(out, '<div class="dim center" style="padding:18px 0">Menunggu jawaban AI…</div>');
      const t0 = performance.now();
      try {
        const prompt = buatPrompt({ topik, level: levelSel.value });
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
        if (alive) { busy = false; aksiBtn.disabled = false; aksiBtn.textContent = 'Jelaskan'; }
      }
    });
  }

  const aksiBtn = T.btn('Jelaskan', () => jalan(), true);
  root.appendChild(T.el('<div style="height:8px"></div>'));
  root.appendChild(T.row(aksiBtn));
  root.appendChild(statusBox);
  root.appendChild(out);
  root.appendChild(T.el(utils.puter.poweredBy()));
}
