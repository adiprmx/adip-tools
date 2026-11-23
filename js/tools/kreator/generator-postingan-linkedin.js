import { h as T, utils } from '../../core.js';

export const meta = {"id":"generator-postingan-linkedin","name":"Generator Postingan LinkedIn","cat":"kreator","icon":"💼","desc":"Postingan LinkedIn profesional dari idemu.","keywords":"linkedin,postingan,profesional,karier,ai,puter","since":"6.18.0", "online": true};

const MAX_IDE = 2000;
const NADA = [
  ['profesional', 'Profesional', 'profesional dan rapi'],
  ['santai', 'Santai', 'santai tapi tetap sopan'],
  ['inspiratif', 'Inspiratif', 'inspiratif dan menyemangati'],
];

// Ekstrak teks dari respons puter.ai.chat (bentuknya bisa string / objek).
// chatText, errPesan kanonis tinggal di utils (core.js).

// Pembentuk prompt murni (bisa diuji tanpa SDK).
export function buatPrompt(o) {
  const n = NADA.find(([v]) => v === (o && o.nada)) || NADA[0];
  return 'Tuliskan postingan LinkedIn dalam Bahasa Indonesia dari ide berikut.\n\n' +
    'Ide atau pesan: ' + (o.ide || '') + '\n\n' +
    'Nadanya ' + n[2] + '. Postingannya maksimal 200 kata, dibuka dengan kalimat yang menarik perhatian, dan ditutup dengan pertanyaan yang mengajak pembaca berkomentar. ' +
    'Tambahkan 3 hashtag yang nyambung di akhir. ' +
    'Jawab HANYA dengan postingannya, tanpa penjelasan tambahan.';
}

export function render(root) {
  const puter = utils.puter.panel();
  root.appendChild(puter.box);
  puter.refresh();

  let alive = true, busy = false, lastHasil = '';
  T.onLeave(() => { alive = false; });

  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Tulis ide atau pesan yang mau kamu sampaikan, dan AI akan menyusunnya jadi postingan LinkedIn yang rapi. Diproses lewat <b>akun Puter milikmu</b> (login gratis, sekali saja). Teksmu tidak disimpan di mana pun.</p>'));

  /* ---------- Input ---------- */
  const ideTa = T.ta(4, 'Ide atau pesanmu…\nContoh: Setelah 3 tahun kerja remote, saya belajar kalau komunikasi yang jelas jauh lebih penting daripada jam kerja yang panjang.');
  ideTa.maxLength = MAX_IDE;
  const hitung = T.el('<div class="dim" style="font-size:11.5px;text-align:right;margin-top:2px">0 / ' + MAX_IDE + '</div>');
  ideTa.addEventListener('input', () => { hitung.textContent = ideTa.value.length + ' / ' + MAX_IDE; });
  root.appendChild(T.field('Ide atau pesan', ideTa));
  root.appendChild(hitung);

  const nadaSel = T.select(NADA.map(([v, l]) => [v, l]), 'profesional');
  root.appendChild(T.field('Nada postingan', nadaSel));

  const statusBox = T.el('<div class="dim" style="font-size:12.5px;margin:8px 0;min-height:18px" role="status" aria-live="polite"></div>');
  const setStatus = (t, cls) => { if (alive) statusBox.innerHTML = t ? '<span class="' + (cls || '') + '">' + t + '</span>' : ''; };

  const out = T.out();

  function tampilHasil(teks, detik) {
    lastHasil = teks;
    T.show(out,
      '<div style="border:1px solid #ffffff20;border-radius:10px;padding:12px">' +
      '<div style="font-weight:700;font-size:13px;margin-bottom:6px">Hasil postingan LinkedIn</div>' +
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
    const ide = ideTa.value.trim();
    if (ide.length < 10) { setStatus('Tulis idemu sedikit lebih lengkap (minimal 10 huruf).', 'err'); ideTa.focus(); return; }
    await puter.need(async () => {
      busy = true; aksiBtn.disabled = true; aksiBtn.textContent = 'AI sedang menulis…';
      setStatus('AI sedang menyusun postinganmu…', '');
      T.show(out, '<div class="dim center" style="padding:18px 0">Menunggu jawaban AI…</div>');
      const t0 = performance.now();
      try {
        const prompt = buatPrompt({ ide, nada: nadaSel.value });
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
        if (alive) { busy = false; aksiBtn.disabled = false; aksiBtn.textContent = 'Buat Postingan'; }
      }
    });
  }

  const aksiBtn = T.btn('Buat Postingan', () => jalan(), true);
  root.appendChild(T.el('<div style="height:8px"></div>'));
  root.appendChild(T.row(aksiBtn));
  root.appendChild(statusBox);
  root.appendChild(out);
  root.appendChild(T.el(utils.puter.poweredBy()));
}
