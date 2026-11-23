import { h as T, utils } from '../../core.js';

export const meta = {"id":"generator-brief-konten","name":"Generator Brief Konten","cat":"kreator","icon":"📋","desc":"Brief konten lengkap dari topik dan audiensmu.","keywords":"brief,konten,kreator,rencana,ai,puter","since":"6.18.0", "online": true};

const PLATFORM = [
  ['instagram', 'Instagram', 'Instagram'],
  ['tiktok', 'TikTok', 'TikTok'],
  ['youtube', 'YouTube', 'YouTube'],
  ['blog', 'Blog', 'blog'],
];
const TUJUAN = [
  ['dikenal', 'Dikenal banyak orang', 'dikenal lebih banyak orang'],
  ['jualan', 'Jualan', 'menjual produk atau jasa'],
  ['ajari', 'Mengajarkan sesuatu', 'mengajarkan sesuatu yang berguna'],
  ['komunitas', 'Bangun komunitas', 'membangun komunitas yang aktif'],
];

// Ekstrak teks dari respons puter.ai.chat (bentuknya bisa string / objek).
// chatText, errPesan kanonis tinggal di utils (core.js).

// Pembentuk prompt murni (bisa diuji tanpa SDK).
export function buatPrompt(o) {
  const p = PLATFORM.find(([v]) => v === (o && o.platform)) || PLATFORM[0];
  const t = TUJUAN.find(([v]) => v === (o && o.tujuan)) || TUJUAN[0];
  return 'Buatkan brief konten dalam Bahasa Indonesia.\n\n' +
    'Topik: ' + (o.topik || '') + '\n' +
    'Audiens: ' + (o.audiens || 'umum') + '\n' +
    'Platform: ' + p[2] + '\n' +
    'Tujuan konten: ' + t[2] + '\n\n' +
    'Briefnya berisi: judul yang menarik, pesan utama, 3 poin penting, format yang cocok untuk platform ini, dan ajakan di akhir. ' +
    'Jawab HANYA dengan briefnya, tanpa penjelasan tambahan.';
}

export function render(root) {
  const puter = utils.puter.panel();
  root.appendChild(puter.box);
  puter.refresh();

  let alive = true, busy = false, lastHasil = '';
  T.onLeave(() => { alive = false; });

  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Tulis topik dan siapa yang menonton, dan AI akan menyusun brief konten yang siap dieksekusi. Diproses lewat <b>akun Puter milikmu</b> (login gratis, sekali saja). Teksmu tidak disimpan di mana pun.</p>'));

  /* ---------- Input ---------- */
  const topikInp = T.input('text', 'Contoh: cara merawat tanaman hias, review HP 3 jutaan');
  topikInp.maxLength = 200;
  root.appendChild(T.field('Topik konten', topikInp));

  const audiensInp = T.input('text', 'Contoh: pemula yang baru mulai berkebun, pelajar');
  audiensInp.maxLength = 100;
  root.appendChild(T.field('Siapa audiensnya', audiensInp));

  const platformSel = T.select(PLATFORM.map(([v, l]) => [v, l]), 'instagram');
  root.appendChild(T.field('Platform', platformSel));

  const tujuanSel = T.select(TUJUAN.map(([v, l]) => [v, l]), 'dikenal');
  root.appendChild(T.field('Tujuan konten', tujuanSel));

  const statusBox = T.el('<div class="dim" style="font-size:12.5px;margin:8px 0;min-height:18px" role="status" aria-live="polite"></div>');
  const setStatus = (t, cls) => { if (alive) statusBox.innerHTML = t ? '<span class="' + (cls || '') + '">' + t + '</span>' : ''; };

  const out = T.out();

  function tampilHasil(teks, detik) {
    lastHasil = teks;
    T.show(out,
      '<div style="border:1px solid #ffffff20;border-radius:10px;padding:12px">' +
      '<div style="font-weight:700;font-size:13px;margin-bottom:6px">Hasil brief konten</div>' +
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
    const topik = topikInp.value.trim();
    const audiens = audiensInp.value.trim();
    if (topik.length < 3) { setStatus('Tulis dulu topiknya (minimal 3 huruf).', 'err'); topikInp.focus(); return; }
    if (audiens.length < 2) { setStatus('Tulis dulu siapa audiensnya.', 'err'); audiensInp.focus(); return; }
    await puter.need(async () => {
      busy = true; aksiBtn.disabled = true; aksiBtn.textContent = 'AI sedang menulis…';
      setStatus('AI sedang menyusun briefmu…', '');
      T.show(out, '<div class="dim center" style="padding:18px 0">Menunggu jawaban AI…</div>');
      const t0 = performance.now();
      try {
        const prompt = buatPrompt({ topik, audiens, platform: platformSel.value, tujuan: tujuanSel.value });
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
        if (alive) { busy = false; aksiBtn.disabled = false; aksiBtn.textContent = 'Buat Brief'; }
      }
    });
  }

  const aksiBtn = T.btn('Buat Brief', () => jalan(), true);
  root.appendChild(T.el('<div style="height:8px"></div>'));
  root.appendChild(T.row(aksiBtn));
  root.appendChild(statusBox);
  root.appendChild(out);
  root.appendChild(T.el(utils.puter.poweredBy()));
}
