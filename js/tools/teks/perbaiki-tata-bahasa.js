import { h as T, utils } from '../../core.js';

export const meta = {"id":"perbaiki-tata-bahasa","name":"Perbaiki Tata Bahasa","cat":"teks","icon":"📏","desc":"Perbaiki ejaan dan tata bahasa teksmu.","keywords":"tata bahasa,ejaan,perbaiki,teks,ai,puter","since":"6.18.0", "online": true};

const MAX_TEKS = 5000;

// Ekstrak teks dari respons puter.ai.chat (bentuknya bisa string / objek).
// chatText, errPesan kanonis tinggal di utils (core.js).

// Pembentuk prompt murni (bisa diuji tanpa SDK).
export function buatPrompt(o) {
  return 'Perbaiki ejaan dan tata bahasa teks berikut ini sesuai kaidah Bahasa Indonesia yang benar. ' +
    'Perbaiki huruf besar, tanda baca, dan kata yang salah ketik. ' +
    'Jangan mengubah arti, gaya, atau isi teksnya. ' +
    'Jawab HANYA dengan teks yang sudah diperbaiki, tanpa penjelasan tambahan.\n\nTeks:\n' + (o.teks || '');
}

export function render(root) {
  const puter = utils.puter.panel();
  root.appendChild(puter.box);
  puter.refresh();

  let alive = true, busy = false, lastHasil = '';
  T.onLeave(() => { alive = false; });

  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Tempel teksmu, dan AI akan memperbaiki ejaan dan tata bahasanya tanpa mengubah maksudnya. Diproses lewat <b>akun Puter milikmu</b> (login gratis, sekali saja). Teksmu tidak disimpan di mana pun.</p>'));

  /* ---------- Input ---------- */
  const ta = T.ta(6, 'Tempel teksmu di sini…\nContoh: saya kemaren pergi ke pasar untuk membeli sayur dan buah buahan. Harganya murah murah dan segar segar.');
  ta.maxLength = MAX_TEKS;
  const hitung = T.el('<div class="dim" style="font-size:11.5px;text-align:right;margin-top:2px">0 / ' + MAX_TEKS + '</div>');
  ta.addEventListener('input', () => { hitung.textContent = ta.value.length + ' / ' + MAX_TEKS; });
  root.appendChild(T.field('Teks yang diperbaiki', ta));
  root.appendChild(hitung);

  const statusBox = T.el('<div class="dim" style="font-size:12.5px;margin:8px 0;min-height:18px" role="status" aria-live="polite"></div>');
  const setStatus = (t, cls) => { if (alive) statusBox.innerHTML = t ? '<span class="' + (cls || '') + '">' + t + '</span>' : ''; };

  const out = T.out();

  function tampilHasil(teks, detik) {
    lastHasil = teks;
    T.show(out,
      '<div style="border:1px solid #ffffff20;border-radius:10px;padding:12px">' +
      '<div style="font-weight:700;font-size:13px;margin-bottom:6px">Hasil perbaikan</div>' +
      '<div style="font-size:14px;line-height:1.7;white-space:pre-wrap;word-break:break-word">' + T.esc(teks) + '</div>' +
      '</div>');
    const row = T.el('<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px"></div>');
    row.appendChild(T.copyBtn(() => lastHasil, 'Salin hasil'));
    row.appendChild(T.btn('Perbaiki lagi', () => jalan()));
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
      busy = true; aksiBtn.disabled = true; aksiBtn.textContent = 'AI sedang memeriksa…';
      setStatus('AI sedang memeriksa tata bahasamu…', '');
      T.show(out, '<div class="dim center" style="padding:18px 0">Menunggu jawaban AI…</div>');
      const t0 = performance.now();
      try {
        const prompt = buatPrompt({ teks });
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
        if (alive) { busy = false; aksiBtn.disabled = false; aksiBtn.textContent = 'Perbaiki'; }
      }
    });
  }

  const aksiBtn = T.btn('Perbaiki', () => jalan(), true);
  root.appendChild(T.el('<div style="height:8px"></div>'));
  root.appendChild(T.row(aksiBtn));
  root.appendChild(statusBox);
  root.appendChild(out);
  root.appendChild(T.el(utils.puter.poweredBy()));
}
