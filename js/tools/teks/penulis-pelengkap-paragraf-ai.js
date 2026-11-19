import { h as T, utils } from '../../core.js';

export const meta = {"id":"penulis-pelengkap-paragraf-ai","name":"Penulis & Pelengkap Paragraf AI","cat":"teks","icon":"✏️","desc":"Tulis atau lanjutkan paragraf dari kalimat pembukamu.","keywords":"paragraf,lanjutkan,penulis,teks,ai,puter","since":"6.18.0"};

const MAX_PEMBUKA = 2000;
const PANJANG = [
  ['satu', 'Satu paragraf', 'satu paragraf'],
  ['dua', 'Dua paragraf', 'dua paragraf'],
];

// Ekstrak teks dari respons puter.ai.chat (bentuknya bisa string / objek).
// chatText, errPesan kanonis tinggal di utils (core.js).

// Pembentuk prompt murni (bisa diuji tanpa SDK).
export function buatPrompt(o) {
  const p = PANJANG.find(([v]) => v === (o && o.panjang)) || PANJANG[0];
  return 'Lanjutkan tulisan berikut ini dalam Bahasa Indonesia, sepanjang ' + p[2] + '. ' +
    'Ikuti gaya dan arah kalimat pembukanya. Jangan mengulang kalimat pembukanya. ' +
    'Jawab HANYA dengan lanjutannya, tanpa penjelasan tambahan.\n\nKalimat pembuka:\n' + (o.pembuka || '');
}

export function render(root) {
  const puter = utils.puter.panel();
  root.appendChild(puter.box);
  puter.refresh();

  let alive = true, busy = false, lastHasil = '';
  T.onLeave(() => { alive = false; });

  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Tulis kalimat pembukamu, dan AI akan melanjutkannya jadi paragraf yang nyambung. Diproses lewat <b>akun Puter milikmu</b> (login gratis, sekali saja). Teksmu tidak disimpan di mana pun.</p>'));

  /* ---------- Input ---------- */
  const ta = T.ta(4, 'Tulis kalimat pembukamu di sini…\nContoh: Pagi itu, hujan turun deras di Jakarta, dan Dina baru sadar kalau payungnya tertinggal di kantor.');
  ta.maxLength = MAX_PEMBUKA;
  const hitung = T.el('<div class="dim" style="font-size:11.5px;text-align:right;margin-top:2px">0 / ' + MAX_PEMBUKA + '</div>');
  ta.addEventListener('input', () => { hitung.textContent = ta.value.length + ' / ' + MAX_PEMBUKA; });
  root.appendChild(T.field('Kalimat pembuka', ta));
  root.appendChild(hitung);

  const panjangSel = T.select(PANJANG.map(([v, l]) => [v, l]), 'satu');
  root.appendChild(T.field('Panjang lanjutan', panjangSel));

  const statusBox = T.el('<div class="dim" style="font-size:12.5px;margin:8px 0;min-height:18px" role="status" aria-live="polite"></div>');
  const setStatus = (t, cls) => { if (alive) statusBox.innerHTML = t ? '<span class="' + (cls || '') + '">' + t + '</span>' : ''; };

  const out = T.out();

  function tampilHasil(teks, detik) {
    lastHasil = teks;
    T.show(out,
      '<div style="border:1px solid #ffffff20;border-radius:10px;padding:12px">' +
      '<div style="font-weight:700;font-size:13px;margin-bottom:6px">Hasil lanjutan paragraf</div>' +
      '<div style="font-size:14px;line-height:1.7;white-space:pre-wrap;word-break:break-word">' + T.esc(teks) + '</div>' +
      '</div>');
    const row = T.el('<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px"></div>');
    row.appendChild(T.copyBtn(() => lastHasil, 'Salin hasil'));
    row.appendChild(T.btn('Lanjutkan lagi', () => jalan()));
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
    const pembuka = ta.value.trim();
    if (pembuka.length < 10) { setStatus('Tulis dulu kalimat pembukanya (minimal 10 huruf).', 'err'); ta.focus(); return; }
    await puter.need(async () => {
      busy = true; aksiBtn.disabled = true; aksiBtn.textContent = 'AI sedang menulis…';
      setStatus('AI sedang melanjutkan paragrafmu…', '');
      T.show(out, '<div class="dim center" style="padding:18px 0">Menunggu jawaban AI…</div>');
      const t0 = performance.now();
      try {
        const prompt = buatPrompt({ pembuka, panjang: panjangSel.value });
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
        if (alive) { busy = false; aksiBtn.disabled = false; aksiBtn.textContent = 'Lanjutkan Paragraf'; }
      }
    });
  }

  const aksiBtn = T.btn('Lanjutkan Paragraf', () => jalan(), true);
  root.appendChild(T.el('<div style="height:8px"></div>'));
  root.appendChild(T.row(aksiBtn));
  root.appendChild(statusBox);
  root.appendChild(out);
  root.appendChild(T.el(utils.puter.poweredBy()));
}
