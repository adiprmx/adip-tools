import { h as T, utils } from '../../core.js';

export const meta = {"id":"penulis-ulang-kalimat-ai","name":"Penulis Ulang Kalimat AI","cat":"teks","icon":"✍️","desc":"Tulis ulang kalimat dengan gaya berbeda pakai AI.","keywords":"tulis ulang,parafrase,kalimat,ai,gaya,puter","since":"6.18.0"};

const MAX_TEKS = 2000;
const GAYA = [
  ['santai', 'Santai', 'tulis ulang dengan gaya santai sehari-hari, tetap sopan'],
  ['formal', 'Formal', 'tulis ulang dengan gaya formal dan rapi'],
  ['singkat', 'Singkat & padat', 'tulis ulang jadi lebih singkat dan padat tanpa mengubah maksud'],
  ['hidup', 'Lebih hidup', 'tulis ulang dengan gaya yang lebih hidup dan menarik'],
];

// Ekstrak teks dari respons puter.ai.chat (bentuknya bisa string / objek).
// chatText, errPesan kanonis tinggal di utils (core.js).

export function render(root) {
  const puter = utils.puter.panel();
  root.appendChild(puter.box);
  puter.refresh();

  let alive = true, busy = false, lastHasil = '', lastGaya = 'santai';
  T.onLeave(() => { alive = false; });

  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Tulis kalimatmu, pilih gaya, dan AI akan menulis ulangnya dengan arti yang sama. Diproses lewat <b>akun Puter milikmu</b> (login gratis). Teksmu tidak disimpan di mana pun.</p>'));

  /* ---------- Input ---------- */
  const ta = T.ta(4, 'Tulis kalimat atau paragraf di sini…\nContoh: Saya sangat senang karena akhirnya bisa menyelesaikan proyek ini tepat waktu.');
  ta.maxLength = MAX_TEKS;
  const hitung = T.el('<div class="dim" style="font-size:11.5px;text-align:right;margin-top:2px">0 / ' + MAX_TEKS + '</div>');
  ta.addEventListener('input', () => { hitung.textContent = ta.value.length + ' / ' + MAX_TEKS; });
  root.appendChild(T.field('Kalimatmu', ta));
  root.appendChild(hitung);

  const gayaSel = T.select(GAYA.map(([v, l]) => [v, l]), 'santai');
  root.appendChild(T.field('Gaya penulisan', gayaSel));

  const statusBox = T.el('<div class="dim" style="font-size:12.5px;margin:8px 0;min-height:18px" role="status" aria-live="polite"></div>');
  const setStatus = (t, cls) => { if (alive) statusBox.innerHTML = t ? '<span class="' + (cls || '') + '">' + t + '</span>' : ''; };

  const out = T.out();

  function tampilHasil(teks, detik) {
    lastHasil = teks;
    T.show(out,
      '<div style="border:1px solid #ffffff20;border-radius:10px;padding:12px">' +
      '<div style="font-weight:700;font-size:13px;margin-bottom:6px">Hasil tulis ulang</div>' +
      '<div style="font-size:14px;line-height:1.7;white-space:pre-wrap;word-break:break-word">' + T.esc(teks) + '</div>' +
      '</div>');
    const row = T.el('<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px"></div>');
    row.appendChild(T.copyBtn(() => lastHasil, 'Salin hasil'));
    row.appendChild(T.btn('Tulis ulang lagi', () => jalan()));
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
    if (teks.length < 3) { setStatus('Tulis dulu kalimatnya (minimal 3 huruf).', 'err'); ta.focus(); return; }
    lastGaya = gayaSel.value;
    const g = GAYA.find(([v]) => v === lastGaya) || GAYA[0];
    await puter.need(async () => {
      busy = true; tulisBtn.disabled = true; tulisBtn.textContent = 'AI sedang menulis…';
      setStatus('AI sedang menulis ulang kalimatmu…', '');
      T.show(out, '<div class="dim center" style="padding:18px 0">Menunggu jawaban AI…</div>');
      const t0 = performance.now();
      try {
        const prompt = 'Tulis ulang kalimat berikut ini, ' + g[2] + '. ' +
          'Pertahankan arti dan fakta aslinya. Jawab HANYA dengan hasil tulis ulangnya, tanpa penjelasan tambahan.\n\nKalimat:\n' + teks;
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
        if (alive) { busy = false; tulisBtn.disabled = false; tulisBtn.textContent = 'Tulis Ulang'; }
      }
    });
  }

  const tulisBtn = T.btn('Tulis Ulang', () => jalan(), true);
  root.appendChild(T.el('<div style="height:8px"></div>'));
  root.appendChild(T.row(tulisBtn));
  root.appendChild(statusBox);
  root.appendChild(out);
  root.appendChild(T.el(utils.puter.poweredBy()));
}
