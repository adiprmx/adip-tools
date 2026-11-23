import { h as T, utils } from '../../core.js';

export const meta = {"id":"perubah-nada-tulisan","name":"Perubah Nada Tulisan","cat":"teks","icon":"🎭","desc":"Ubah nada tulisan: formal, santai, atau persuasif.","keywords":"nada,tulisan,formal,santai,persuasif,ai,puter","since":"6.18.0", "online": true};

const MAX_TEKS = 3000;
const NADA = [
  ['formal', 'Formal', 'formal dan rapi, cocok untuk surat atau dokumen resmi'],
  ['santai', 'Santai', 'santai seperti sedang ngobrol dengan teman'],
  ['persuasif', 'Persuasif', 'persuasif, mendorong pembaca untuk setuju atau bertindak'],
  ['ramah', 'Ramah', 'ramah dan hangat'],
];

// Ekstrak teks dari respons puter.ai.chat (bentuknya bisa string / objek).
// chatText, errPesan kanonis tinggal di utils (core.js).

// Pembentuk prompt murni (bisa diuji tanpa SDK).
export function buatPrompt(o) {
  const n = NADA.find(([v]) => v === (o && o.nada)) || NADA[0];
  return 'Ubah nada tulisan berikut ini jadi ' + n[2] + '. ' +
    'Pertahankan arti, fakta, dan angka aslinya, ubah hanya pilihan kata dan gaya kalimatnya. ' +
    'Jawab HANYA dengan hasil ubahannya, tanpa penjelasan tambahan.\n\nTulisan:\n' + (o.teks || '');
}

export function render(root) {
  const puter = utils.puter.panel();
  root.appendChild(puter.box);
  puter.refresh();

  let alive = true, busy = false, lastHasil = '';
  T.onLeave(() => { alive = false; });

  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Tempel tulisanmu, pilih nada yang kamu mau, dan AI akan menulis ulangnya dengan nada itu tanpa mengubah maksudnya. Diproses lewat <b>akun Puter milikmu</b> (login gratis, sekali saja). Teksmu tidak disimpan di mana pun.</p>'));

  /* ---------- Input ---------- */
  const ta = T.ta(5, 'Tempel tulisanmu di sini…\nContoh: Tolong kirim laporan itu secepatnya, saya butuh hari ini juga.');
  ta.maxLength = MAX_TEKS;
  const hitung = T.el('<div class="dim" style="font-size:11.5px;text-align:right;margin-top:2px">0 / ' + MAX_TEKS + '</div>');
  ta.addEventListener('input', () => { hitung.textContent = ta.value.length + ' / ' + MAX_TEKS; });
  root.appendChild(T.field('Tulisanmu', ta));
  root.appendChild(hitung);

  const nadaSel = T.select(NADA.map(([v, l]) => [v, l]), 'formal');
  root.appendChild(T.field('Nada yang dituju', nadaSel));

  const statusBox = T.el('<div class="dim" style="font-size:12.5px;margin:8px 0;min-height:18px" role="status" aria-live="polite"></div>');
  const setStatus = (t, cls) => { if (alive) statusBox.innerHTML = t ? '<span class="' + (cls || '') + '">' + t + '</span>' : ''; };

  const out = T.out();

  function tampilHasil(teks, detik) {
    lastHasil = teks;
    T.show(out,
      '<div style="border:1px solid #ffffff20;border-radius:10px;padding:12px">' +
      '<div style="font-weight:700;font-size:13px;margin-bottom:6px">Hasil ubah nada</div>' +
      '<div style="font-size:14px;line-height:1.7;white-space:pre-wrap;word-break:break-word">' + T.esc(teks) + '</div>' +
      '</div>');
    const row = T.el('<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px"></div>');
    row.appendChild(T.copyBtn(() => lastHasil, 'Salin hasil'));
    row.appendChild(T.btn('Ubah lagi', () => jalan()));
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
      setStatus('AI sedang mengubah nada tulisanmu…', '');
      T.show(out, '<div class="dim center" style="padding:18px 0">Menunggu jawaban AI…</div>');
      const t0 = performance.now();
      try {
        const prompt = buatPrompt({ teks, nada: nadaSel.value });
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
        if (alive) { busy = false; aksiBtn.disabled = false; aksiBtn.textContent = 'Ubah Nada'; }
      }
    });
  }

  const aksiBtn = T.btn('Ubah Nada', () => jalan(), true);
  root.appendChild(T.el('<div style="height:8px"></div>'));
  root.appendChild(T.row(aksiBtn));
  root.appendChild(statusBox);
  root.appendChild(out);
  root.appendChild(T.el(utils.puter.poweredBy()));
}
