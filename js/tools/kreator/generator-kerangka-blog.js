import { h as T, utils } from '../../core.js';

export const meta = {"id":"generator-kerangka-blog","name":"Generator Kerangka Blog","cat":"kreator","icon":"🗂️","desc":"Kerangka artikel blog terstruktur dari judulmu.","keywords":"kerangka,blog,outline,artikel,ai,puter","since":"6.18.0"};

const JUMLAH = [
  ['3', '3 bagian', '3'],
  ['5', '5 bagian', '5'],
  ['7', '7 bagian', '7'],
];

// Ekstrak teks dari respons puter.ai.chat (bentuknya bisa string / objek).
// chatText, errPesan kanonis tinggal di utils (core.js).

// Pembentuk prompt murni (bisa diuji tanpa SDK).
export function buatPrompt(o) {
  const j = JUMLAH.find(([v]) => v === (o && o.jumlah)) || JUMLAH[1];
  return 'Buatkan kerangka artikel blog dalam Bahasa Indonesia.\n\n' +
    'Judul atau topik: ' + (o.judul || '') + '\n' +
    'Pembaca yang dituju: ' + (o.audiens || 'umum') + '\n\n' +
    'Kerangkanya punya ' + j[2] + ' bagian utama, tiap bagian berisi judul bagian dan 2 sampai 3 poin yang dibahas. ' +
    'Urutannya logis dari pembuka sampai penutup. ' +
    'Jawab HANYA dengan kerangkanya, tanpa penjelasan tambahan.';
}

export function render(root) {
  const puter = utils.puter.panel();
  root.appendChild(puter.box);
  puter.refresh();

  let alive = true, busy = false, lastHasil = '';
  T.onLeave(() => { alive = false; });

  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Tulis judul atau topik artikelmu, dan AI akan menyusun kerangkanya bagian per bagian supaya kamu tinggal mengisi. Diproses lewat <b>akun Puter milikmu</b> (login gratis, sekali saja). Teksmu tidak disimpan di mana pun.</p>'));

  /* ---------- Input ---------- */
  const judulInp = T.input('text', 'Contoh: Cara merawat tanaman hias untuk pemula');
  judulInp.maxLength = 200;
  root.appendChild(T.field('Judul atau topik', judulInp));

  const audiensInp = T.input('text', 'Contoh: pemula yang baru mulai berkebun (boleh kosong)');
  audiensInp.maxLength = 100;
  root.appendChild(T.field('Siapa pembacanya', audiensInp));

  const jumlahSel = T.select(JUMLAH.map(([v, l]) => [v, l]), '5');
  root.appendChild(T.field('Jumlah bagian', jumlahSel));

  const statusBox = T.el('<div class="dim" style="font-size:12.5px;margin:8px 0;min-height:18px" role="status" aria-live="polite"></div>');
  const setStatus = (t, cls) => { if (alive) statusBox.innerHTML = t ? '<span class="' + (cls || '') + '">' + t + '</span>' : ''; };

  const out = T.out();

  function tampilHasil(teks, detik) {
    lastHasil = teks;
    T.show(out,
      '<div style="border:1px solid #ffffff20;border-radius:10px;padding:12px">' +
      '<div style="font-weight:700;font-size:13px;margin-bottom:6px">Hasil kerangka blog</div>' +
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
    const judul = judulInp.value.trim();
    if (judul.length < 3) { setStatus('Tulis dulu judul atau topiknya (minimal 3 huruf).', 'err'); judulInp.focus(); return; }
    await puter.need(async () => {
      busy = true; aksiBtn.disabled = true; aksiBtn.textContent = 'AI sedang menulis…';
      setStatus('AI sedang menyusun kerangkamu…', '');
      T.show(out, '<div class="dim center" style="padding:18px 0">Menunggu jawaban AI…</div>');
      const t0 = performance.now();
      try {
        const prompt = buatPrompt({ judul, audiens: audiensInp.value.trim(), jumlah: jumlahSel.value });
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
        if (alive) { busy = false; aksiBtn.disabled = false; aksiBtn.textContent = 'Buat Kerangka'; }
      }
    });
  }

  const aksiBtn = T.btn('Buat Kerangka', () => jalan(), true);
  root.appendChild(T.el('<div style="height:8px"></div>'));
  root.appendChild(T.row(aksiBtn));
  root.appendChild(statusBox);
  root.appendChild(out);
  root.appendChild(T.el(utils.puter.poweredBy()));
}
