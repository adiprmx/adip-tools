import { h as T, utils } from '../../core.js';

export const meta = {"id":"generator-caption-instagram","name":"Generator Caption Instagram","cat":"kreator","icon":"📸","desc":"Caption Instagram menarik dari tema fotomu.","keywords":"caption,instagram,ig,kreator,ai,puter","since":"6.18.0"};

const MAX_TEMA = 2000;
const GAYA = [
  ['santai', 'Santai', 'santai seperti sedang ngobrol dengan teman'],
  ['lucu', 'Lucu', 'lucu dan ringan'],
  ['inspiratif', 'Inspiratif', 'inspiratif dan menyemangati'],
  ['profesional', 'Profesional', 'profesional dan rapi'],
];
const JUMLAH = [
  ['3', '3 caption', '3'],
  ['5', '5 caption', '5'],
];

// Ekstrak teks dari respons puter.ai.chat (bentuknya bisa string / objek).
// chatText, errPesan kanonis tinggal di utils (core.js).

// Pembentuk prompt murni (bisa diuji tanpa SDK).
export function buatPrompt(o) {
  const g = GAYA.find(([v]) => v === (o && o.gaya)) || GAYA[0];
  const j = JUMLAH.find(([v]) => v === (o && o.jumlah)) || JUMLAH[0];
  return 'Buatkan ' + j[2] + ' caption Instagram dalam Bahasa Indonesia untuk tema berikut.\n\n' +
    'Tema foto atau video: ' + (o.tema || '') + '\n\n' +
    'Gayanya ' + g[2] + '. Tiap caption maksimal 3 kalimat, beda-beda sudutnya, dan diakhiri dengan 3 sampai 5 hashtag yang nyambung. ' +
    'Jawab HANYA dengan daftar captionnya, tanpa penjelasan tambahan.';
}

export function render(root) {
  const puter = utils.puter.panel();
  root.appendChild(puter.box);
  puter.refresh();

  let alive = true, busy = false, lastHasil = '';
  T.onLeave(() => { alive = false; });

  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Ceritakan tema foto atau videomu, dan AI akan membuat beberapa pilihan caption Instagram lengkap dengan hashtagnya. Diproses lewat <b>akun Puter milikmu</b> (login gratis, sekali saja). Teksmu tidak disimpan di mana pun.</p>'));

  /* ---------- Input ---------- */
  const temaTa = T.ta(3, 'Tema foto atau videomu…\nContoh: Foto sarapan di kafe baru, roti panggang dan kopi susu, suasananya hangat.');
  temaTa.maxLength = MAX_TEMA;
  const hitung = T.el('<div class="dim" style="font-size:11.5px;text-align:right;margin-top:2px">0 / ' + MAX_TEMA + '</div>');
  temaTa.addEventListener('input', () => { hitung.textContent = temaTa.value.length + ' / ' + MAX_TEMA; });
  root.appendChild(T.field('Tema foto atau video', temaTa));
  root.appendChild(hitung);

  const gayaSel = T.select(GAYA.map(([v, l]) => [v, l]), 'santai');
  root.appendChild(T.field('Gaya caption', gayaSel));

  const jumlahSel = T.select(JUMLAH.map(([v, l]) => [v, l]), '3');
  root.appendChild(T.field('Jumlah caption', jumlahSel));

  const statusBox = T.el('<div class="dim" style="font-size:12.5px;margin:8px 0;min-height:18px" role="status" aria-live="polite"></div>');
  const setStatus = (t, cls) => { if (alive) statusBox.innerHTML = t ? '<span class="' + (cls || '') + '">' + t + '</span>' : ''; };

  const out = T.out();

  function tampilHasil(teks, detik) {
    lastHasil = teks;
    T.show(out,
      '<div style="border:1px solid #ffffff20;border-radius:10px;padding:12px">' +
      '<div style="font-weight:700;font-size:13px;margin-bottom:6px">Hasil caption Instagram</div>' +
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
    const tema = temaTa.value.trim();
    if (tema.length < 10) { setStatus('Ceritakan temanya sedikit lebih lengkap (minimal 10 huruf).', 'err'); temaTa.focus(); return; }
    await puter.need(async () => {
      busy = true; aksiBtn.disabled = true; aksiBtn.textContent = 'AI sedang menulis…';
      setStatus('AI sedang membuat captionnya…', '');
      T.show(out, '<div class="dim center" style="padding:18px 0">Menunggu jawaban AI…</div>');
      const t0 = performance.now();
      try {
        const prompt = buatPrompt({ tema, gaya: gayaSel.value, jumlah: jumlahSel.value });
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
        if (alive) { busy = false; aksiBtn.disabled = false; aksiBtn.textContent = 'Buat Caption'; }
      }
    });
  }

  const aksiBtn = T.btn('Buat Caption', () => jalan(), true);
  root.appendChild(T.el('<div style="height:8px"></div>'));
  root.appendChild(T.row(aksiBtn));
  root.appendChild(statusBox);
  root.appendChild(out);
  root.appendChild(T.el(utils.puter.poweredBy()));
}
