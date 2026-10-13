import { h as T, utils } from '../../core.js?v=6.9.20';

export const meta = {"id":"novelcover","name":"Novel Cover","cat":"desain","icon":"📕","desc":"Buat cover novel AI dari sinopsis + overlay judul.","keywords":"novel,cover,sampul,buku,ai,desain,puter"};

const GENRES = ['Fantasy', 'Romance', 'Villainess', 'Yuri', 'Academy', 'Isekai', 'Action', 'Dark Fantasy', 'Sci-Fi', 'Mystery', 'Horror', 'Modern Fantasy'];
// Profil art direction per genre (ditulis sendiri, perilaku teramati dari tool acuan).
// palet: [teks-terang, aksen, teks-gelap]
const GENRE_PROFIL = {
  'Fantasy': { gaya: 'Fantasi elegan', mood: 'Magis', komposisi: 'Karakter + latar', zona: 'atas', tipografi: 'serif-editorial', palet: ['#f6ead3', '#d7b36a', '#34234f'], cahaya: 'atmosfer magis yang bercahaya', motif: 'satu motif sihir yang rapi' },
  'Romance': { gaya: 'Ilustrasi lembut', mood: 'Romantis', komposisi: 'Potret dada', zona: 'atas', tipografi: 'serif-modern', palet: ['#fff4ed', '#d98f9f', '#503044'], cahaya: 'cahaya jendela yang lembut dan hangat', motif: 'bunga atau kain bergerak yang halus' },
  'Villainess': { gaya: 'Fantasi elegan', mood: 'Anggun', komposisi: 'Potret dada', zona: 'atas', tipografi: 'serif-modern', palet: ['#f5dfb9', '#a33d59', '#25172d'], cahaya: 'pencahayaan editorial yang aristokrat', motif: 'lambang atau permata yang tertahan' },
  'Yuri': { gaya: 'Ilustrasi lembut', mood: 'Romantis', komposisi: 'Dua karakter', zona: 'atas', tipografi: 'serif-modern', palet: ['#fff1f6', '#c985b7', '#58416b'], cahaya: 'keintiman bercahaya yang lembut', motif: 'motif botani berpasangan' },
  'Academy': { gaya: 'Light novel', mood: 'Misterius', komposisi: 'Karakter + latar', zona: 'atas', tipografi: 'serif-modern', palet: ['#f4e7c8', '#7c80b8', '#202b4c'], cahaya: 'siang akademik yang jelas bernuansa rahasia', motif: 'lambang arsitektur atau motif bulan' },
  'Isekai': { gaya: 'Light novel', mood: 'Epik', komposisi: 'Seluruh badan', zona: 'atas', tipografi: 'serif-editorial', palet: ['#f7efd5', '#66a9b3', '#243a57'], cahaya: 'cahaya portal dunia lain yang terang', motif: 'satu portal atau motif relik' },
  'Action': { gaya: 'Sinematik', mood: 'Epik', komposisi: 'Seluruh badan', zona: 'atas', tipografi: 'sans-display', palet: ['#f8e6cf', '#d64c42', '#171a25'], cahaya: 'rim light sinematik yang terarah', motif: 'satu garis energi diagonal' },
  'Dark Fantasy': { gaya: 'Dark fantasy', mood: 'Kelam', komposisi: 'Karakter + latar', zona: 'atas', tipografi: 'serif-editorial', palet: ['#e7dfd2', '#8f304b', '#17131d'], cahaya: 'chiaroscuro low-key yang tertahan', motif: 'satu relik atau motif duri yang mengancam' },
  'Sci-Fi': { gaya: 'Sampul grafis', mood: 'Dingin', komposisi: 'Karakter + latar', zona: 'atas', tipografi: 'sans-bersih', palet: ['#e8fbff', '#4bd5e7', '#101b32'], cahaya: 'edge light futuristik yang bersih', motif: 'satu simbol geometris' },
  'Mystery': { gaya: 'Sinematik', mood: 'Misterius', komposisi: 'Karakter minimal', zona: 'atas', tipografi: 'serif-modern', palet: ['#f0eadc', '#8c7b68', '#202027'], cahaya: 'kolam cahaya dan bayangan yang terkontrol', motif: 'satu petunjuk visual' },
  'Horror': { gaya: 'Dark fantasy', mood: 'Kelam', komposisi: 'Siluet', zona: 'atas', tipografi: 'sans-display', palet: ['#e8e1d5', '#a33a3a', '#171416'], cahaya: 'ketakutan halus dengan ruang negatif yang dalam', motif: 'satu ancaman tersirat, tanpa gore' },
  'Modern Fantasy': { gaya: 'Semi realistis', mood: 'Magis', komposisi: 'Karakter + latar', zona: 'atas', tipografi: 'serif-modern', palet: ['#f4eee8', '#806ec7', '#23223c'], cahaya: 'cahaya sinematik kontemporer beraksen magis', motif: 'satu motif supranatural yang diskret' },
};
const FONTS = [
  ['serif-editorial', 'Editorial Serif'],
  ['serif-modern', 'Modern Serif'],
  ['sans-bersih', 'Clean Sans'],
  ['sans-display', 'Display Sans'],
];
const FONT_FAM = {
  'serif-editorial': 'Georgia, "Times New Roman", serif',
  'serif-modern': '"Palatino Linotype", "Book Antiqua", Georgia, serif',
  'sans-bersih': 'system-ui, -apple-system, "Segoe UI", sans-serif',
  'sans-display': '"Arial Black", system-ui, sans-serif',
};
const FALLBACK_MODELS = ['openai/gpt-image-2.5-flare', 'openai/gpt-image-2', 'google/gemini-3.1-flash-image'];
const ZONA_Y = { atas: 0.09, tengah: 0.38, bawah: 0.66 };

// Susun rencana art direction lokal dari genre + teks (tanpa request AI).
function buatRencana(genre, sinopsis, karakter) {
  const dasar = GENRE_PROFIL[genre] || GENRE_PROFIL.Fantasy;
  const plan = { ...dasar, palet: dasar.palet.slice(), genre };
  const teks = (String(sinopsis || '') + ' ' + String(karakter || '')).toLowerCase();
  if (/dua |two |pasangan|couple|bersama|kembar|rival/.test(teks) && genre !== 'Horror') plan.komposisi = 'Dua karakter';
  if (/kota|city|kerajaan|kingdom|academy|sekolah|library|perpustakaan|forest|hutan|space|planet/.test(teks)) plan.komposisi = 'Karakter + latar';
  if (/sedih|kehilangan|grief|lonely|kesepian|tragic/.test(teks)) plan.mood = 'Melankolis';
  if (/perang|battle|fight|pertarungan|pahlawan|hero/.test(teks)) plan.mood = 'Epik';
  return plan;
}
function promptArtwork(genre, sinopsis, karakter, plan, arahanTambahan) {
  const zonaTeks = plan.zona === 'bawah' ? 'sepertiga bawah' : plan.zona === 'tengah' ? 'pita tengah' : '28% bagian atas';
  return [
    'FINISHED PROFESSIONAL NOVEL COVER ARTWORK, vertical 2:3 publishing cover, not a poster, not a character sheet, not a standalone portrait.',
    'Genre: ' + genre + '. Story concept: ' + String(sinopsis).slice(0, 1200) + '.',
    karakter ? 'Main character: ' + String(karakter).slice(0, 500) + '.' : 'Derive only the essential character from the story.',
    'Visual language: ' + plan.gaya + '. Mood: ' + plan.mood + '. Composition: ' + plan.komposisi + '.',
    'Keep the ' + zonaTeks + ' as deliberately quiet negative space for later title typography.',
    'Lighting: ' + plan.cahaya + '. Motif: ' + plan.motif + '. Palette anchors: ' + plan.palet.join(', ') + '.',
    'Use foreground, middle ground and background depth. Keep the face, hands and story symbol clear. Readable as a small bookstore thumbnail.',
    'CRITICAL: render artwork only. No title, no author, no words, no letters, no captions, no logo, no watermark, no border, no UI, no mockup.',
    'Avoid generic wallpaper composition, excessive empty margins, centered passport pose, visual clutter, heavy bloom, oversaturation, duplicated characters and cropped anatomy.',
    arahanTambahan ? 'User direction: ' + String(arahanTambahan).slice(0, 800) + '.' : '',
  ].filter(Boolean).join('\n');
}
function errPesan(e) {
  const r = (e && typeof e === 'object') ? e : {};
  const n = (r.error && typeof r.error === 'object') ? r.error : r;
  const raw = String(n.code || r.code || n.message || r.message || e || '').toLowerCase();
  if (/popup|blocked/.test(raw)) return 'Jendela login Puter diblokir. Izinkan pop-up lalu coba lagi.';
  if (/email_must_be_confirmed|confirm.*email|email.*confirm/.test(raw)) return 'Email Puter belum dikonfirmasi.';
  if (/cancel|closed|denied|unauthor|auth|sign.?in|login/.test(raw)) return 'Login Puter belum selesai atau sesi habis.';
  if (/402|allowance|credit|quota|insufficient|payment|fund/.test(raw)) return 'Allowance AI Puter tidak cukup. Cek menu Usage di akun Putermu.';
  if (/429|rate|too many|concurren/.test(raw)) return 'Puter masih memproses permintaan lain. Tunggu sebentar lalu coba lagi.';
  if (/safety|moderation|policy|filtered|rai/.test(raw)) return 'Prompt ditolak aturan keamanan. Ubah deskripsi lalu coba lagi.';
  if (/model not found|model.*unavailable|unsupported model|no provider/.test(raw)) return 'Model Puter sedang tidak tersedia. Coba model lain.';
  if (/network|fetch|offline|timeout/.test(raw)) return 'Koneksi ke Puter gagal. Periksa internet atau pemblokir iklan.';
  return 'Puter belum dapat membuat gambar. Coba lagi beberapa saat.';
}
function bisaFallback(e) {
  const r = (e && typeof e === 'object') ? e : {};
  const n = (r.error && typeof r.error === 'object') ? r.error : r;
  const raw = String(n.code || r.code || n.message || r.message || e || '').toLowerCase();
  const st = Number(n.status || r.status || 0);
  if ([400, 401, 402, 403].includes(st) && !/model not found|model.*unavailable|unsupported model|no provider/.test(raw)) return false;
  if (/allowance|credit|quota|payment|safety|moderation|policy|cancel|denied|unauthor|invalid prompt|bad request/.test(raw)) return false;
  return true;
}

export function render(root) {
  const puter = utils.puter.panel();
  root.appendChild(puter.box);
  puter.refresh();

  let alive = true;
  T.onLeave(() => { alive = false; });

  /* ---------- 01 Detail novel ---------- */
  const judul = T.input('text', 'Judul novel…');
  const penulis = T.input('text', 'Nama penulis…');
  const genre = T.select(GENRES.map((g) => [g, g]), 'Fantasy');
  const sinopsis = T.ta(5, 'Konflik utama, dunia cerita, dan momen yang harus terasa di cover… (wajib)');
  sinopsis.maxLength = 3000;
  const sHitung = T.el('<div class="dim" style="font-size:11.5px;text-align:right;margin-top:2px">0 / 3000</div>');
  sinopsis.addEventListener('input', () => { sHitung.textContent = sinopsis.value.length + ' / 3000'; updateRencana(); });
  const karakter = T.ta(2, 'Penampilan, pakaian, ekspresi, dan ciri penting… (opsional)');
  karakter.maxLength = 1200;
  karakter.addEventListener('input', updateRencana);
  genre.addEventListener('change', updateRencana);

  root.appendChild(T.el('<div style="font-weight:700;font-size:14px;margin:4px 0 8px">01 · Detail Novel</div>'));
  root.appendChild(T.grid2(T.field('Judul', judul), T.field('Penulis', penulis)));
  root.appendChild(T.field('Genre', genre));
  root.appendChild(T.field('Sinopsis', sinopsis));
  root.appendChild(sHitung);
  root.appendChild(T.field('Karakter utama (opsional)', karakter));

  /* ---------- 02 Arahan seni (director lokal otomatis) ---------- */
  const arahBox = T.out();
  let rencana = buatRencana('Fantasy', '', '');
  let arahAI = null;
  function updateRencana() {
    rencana = buatRencana(genre.value, sinopsis.value, karakter.value);
    paintArah();
  }
  function paintArah() {
    const r = arahAI || rencana;
    const sumber = arahAI ? 'AI (akun Putermu)' : 'Director lokal otomatis';
    T.show(arahBox,
      '<div style="border:1px solid #ffffff20;border-radius:10px;padding:10px">' +
      '<div style="font-weight:700;font-size:13px;margin-bottom:6px">Arahan seni <span class="dim" style="font-weight:400">(' + T.esc(sumber) + ')</span></div>' +
      '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px">' +
      [r.gaya, r.mood, r.zonaJudulTeks || (r.zona === 'bawah' ? 'Judul bawah' : r.zona === 'tengah' ? 'Judul tengah' : 'Judul atas'), r.tipografi]
        .map((t) => '<span style="font-size:11.5px;border:1px solid #ffffff20;border-radius:20px;padding:3px 10px">' + T.esc(t) + '</span>').join('') +
      '</div>' +
      '<table style="width:100%;border-collapse:collapse;font-size:12.5px">' +
      [['Gaya visual', r.gaya], ['Mood', r.mood], ['Komposisi', r.komposisi], ['Zona judul', r.zona === 'bawah' ? 'Sepertiga bawah' : r.zona === 'tengah' ? 'Pita tengah' : '28% atas'], ['Tipografi', r.tipografi], ['Palet', (r.palet || []).join(' · ')], ['Pencahayaan', r.cahaya], ['Motif', r.motif]]
        .map(([k, v]) => '<tr><td style="padding:5px 8px 5px 0;color:#c9bda9;white-space:nowrap;vertical-align:top">' + T.esc(k) + '</td><td style="padding:5px 0">' + T.esc(v) + '</td></tr>').join('') +
      '</table></div>');
  }
  const btnArahAI = T.btn('Minta versi AI', async () => {
    const s = sinopsis.value.trim();
    if (!s) { T.toast('Isi dulu sinopsisnya'); return; }
    await puter.need(async () => {
      T.show(arahBox, '<div class="dim center">AI menyusun arahan seni…</div>');
      try {
        const prompt = 'Kamu art director cover novel. Genre: ' + genre.value + '. Sinopsis: ' + s.slice(0, 1500) +
          (karakter.value.trim() ? ' Karakter utama: ' + karakter.value.trim().slice(0, 500) : '') +
          '. Jawab SINGKAT dalam format persis 8 baris:\nGAYA: ...\nMOOD: ...\nKOMPOSISI: ...\nZONA: ...\nTIPOGRAFI: ...\nPALET: ...\nPENCAHAYAAN: ...\nMOTIF: ...';
        const res = await window.puter.ai.chat(prompt, {});
        const txt = (typeof res === 'string' ? res : (res && (res.text || res.content)) || '').trim();
        const ambil = (k) => { const m = new RegExp(k + ':\\s*(.+)', 'i').exec(txt); return m ? m[1].trim() : '-'; };
        arahAI = {
          gaya: ambil('GAYA'), mood: ambil('MOOD'), komposisi: ambil('KOMPOSISI'),
          zona: /bawah/i.test(ambil('ZONA')) ? 'bawah' : /tengah/i.test(ambil('ZONA')) ? 'tengah' : 'atas',
          zonaJudulTeks: ambil('ZONA'), tipografi: ambil('TIPOGRAFI'),
          palet: ambil('PALET').split(/[,·]/).map((x) => x.trim()).filter(Boolean).slice(0, 3),
          cahaya: ambil('PENCAHAYAAN'), motif: ambil('MOTIF'),
        };
        if (!arahAI.palet.length) arahAI.palet = rencana.palet;
      } catch (e) { arahAI = null; T.toast('Gagal meminta arahan AI — pakai director lokal'); }
      paintArah();
    });
  });
  const btnArahLokal = T.btn('Kembali ke lokal', () => { arahAI = null; paintArah(); });
  root.appendChild(T.el('<div style="font-weight:700;font-size:14px;margin:14px 0 8px">02 · Arahan Seni</div>'));
  root.appendChild(T.row(btnArahAI, btnArahLokal));
  root.appendChild(arahBox);
  updateRencana();

  /* ---------- 03 Generate artwork ---------- */
  const variasi = T.select([['1', '1 cover'], ['2', '2 cover'], ['4', '4 cover']], '1');
  const modelManual = T.input('text', 'ID model image (opsional, kosongkan = otomatis)');
  const arahanTambahan = T.ta(2, 'Hanya bila ada detail yang benar-benar wajib… (opsional)');
  arahanTambahan.maxLength = 800;
  const refInp = document.createElement('input');
  refInp.type = 'file'; refInp.accept = 'image/jpeg,image/png,image/webp'; refInp.className = 'inp';
  const refInfo = T.el('<div class="dim" style="font-size:12px;margin-top:4px"></div>');
  refInp.addEventListener('change', () => {
    const f = refInp.files[0];
    refInfo.textContent = f ? f.name + ' (' + Math.round(f.size / 1024) + ' KB)' : '';
  });
  const hasilBox = T.out();
  const statusBox = T.el('<div class="dim" style="font-size:12.5px;margin:8px 0;min-height:18px" role="status" aria-live="polite"></div>');
  const setStatus = (t, cls) => { if (alive) statusBox.innerHTML = t ? '<span class="' + (cls || '') + '">' + t + '</span>' : ''; };
  let busy = false;
  let artworks = [];
  let planAktif = null;

  const genBtn = T.btn('Buat Cover Profesional', async () => {
    if (busy) return;
    const s = sinopsis.value.trim();
    if (!judul.value.trim()) { setStatus('Isi dulu judul novelnya.', 'err'); judul.focus(); return; }
    if (s.length < 20) { setStatus('Sinopsis minimal 20 karakter agar AI punya bahan.', 'err'); sinopsis.focus(); return; }
    const n = parseInt(variasi.value, 10) || 1;
    await puter.need(async () => {
      busy = true; genBtn.disabled = true; genBtn.textContent = 'AI Director sedang bekerja…';
      artworks = [];
      planAktif = arahAI || buatRencana(genre.value, s, karakter.value.trim());
      try {
        const prompt = promptArtwork(genre.value, s, karakter.value.trim(), planAktif, arahanTambahan.value.trim());
        const manual = modelManual.value.trim();
        const kandidat = (manual ? [manual] : FALLBACK_MODELS).slice(0, 3);
        let refDu = null, refMime = '';
        const rf = refInp.files[0];
        if (rf) {
          if (rf.size > 4 * 1024 * 1024) throw new Error('Referensi maksimal 4 MB.');
          if (!/^image\/(jpeg|png|webp)$/.test(rf.type)) throw new Error('Referensi harus JPG/PNG/WebP.');
          refDu = await new Promise((res, rej) => {
            const r = new FileReader();
            r.onload = () => res(String(r.result)); r.onerror = () => rej(new Error('gagal baca referensi'));
            r.readAsDataURL(rf);
          });
          refMime = rf.type;
        }
        for (let i = 0; i < n; i++) {
          let src = null, dipakai = '';
          const errs = [];
          for (let a = 0; a < kandidat.length; a++) {
            const mid = kandidat[a];
            setStatus('Menggambar ' + (i + 1) + '/' + n + (a > 0 ? ' — mencoba model cadangan ' + (a + 1) + '/' + kandidat.length : '') + '…', '');
            const opts = { model: mid, ratio: { w: 2, h: 3 } };
            if (refDu) { opts.input_image = refDu; opts.input_image_mime_type = refMime; }
            try {
              const res = await window.puter.ai.txt2img(prompt, opts);
              src = utils.puter.srcOf(res);
              dipakai = mid;
              if (src) break;
            } catch (e) {
              errs.push(e);
              if (!bisaFallback(e)) throw e;
              if (a < kandidat.length - 1) await new Promise((r) => setTimeout(r, (a + 1) * 2000));
            }
          }
          if (!src) throw errs[errs.length - 1] || new Error('Puter tidak mengembalikan gambar.');
          artworks.push({ src, model: dipakai });
        }
        setStatus('Cover profesional siap. Typography dan hierarchy sudah dipasang otomatis.', 'ok');
        paintHasil();
      } catch (e) {
        setStatus(errPesan(e), 'err');
      } finally {
        busy = false; genBtn.disabled = false; genBtn.textContent = 'Buat Cover Profesional';
      }
    });
  }, true);

  // Pakai artwork sendiri (tanpa AI) — director tetap memasang tipografi.
  const artSendiri = document.createElement('input');
  artSendiri.type = 'file'; artSendiri.accept = 'image/jpeg,image/png,image/webp'; artSendiri.style.display = 'none';
  const artSendiriBtn = T.btn('Pakai Artwork Sendiri', () => artSendiri.click());
  artSendiri.addEventListener('change', async () => {
    const f = artSendiri.files[0];
    artSendiri.value = '';
    if (!f) return;
    if (f.size > 12 * 1024 * 1024) { setStatus('Artwork maksimal 12 MB.', 'err'); return; }
    if (!/^image\/(jpeg|png|webp)$/.test(f.type)) { setStatus('Artwork harus JPG/PNG/WebP.', 'err'); return; }
    setStatus('Membuka artwork di composer…', '');
    try {
      const du = await new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(String(r.result)); r.onerror = () => rej(new Error('gagal baca artwork'));
        r.readAsDataURL(f);
      });
      artworks = [{ src: du, model: 'Artwork sendiri (tanpa AI)' }];
      planAktif = arahAI || buatRencana(genre.value, sinopsis.value, karakter.value.trim());
      paintHasil();
      setStatus('Artwork siap. Director memasang judul dan penulis secara otomatis.', 'ok');
    } catch (e) { setStatus(errPesan(e), 'err'); }
  });

  function paintHasil() {
    T.show(hasilBox, '');
    const ringkas = T.el('<div style="border:1px solid #ffffff14;border-radius:10px;padding:8px 10px;margin-bottom:10px;font-size:12px"></div>');
    ringkas.innerHTML = '<b>AI Cover Director</b> · ' + T.esc(planAktif.gaya) + ' · ' + T.esc(planAktif.mood) + ' · ' +
      T.esc(planAktif.komposisi) + ' · zona judul ' + T.esc(planAktif.zona);
    hasilBox.appendChild(ringkas);
    const grid = T.el('<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px"></div>');
    artworks.forEach((a, i) => {
      const card = T.el('<div style="border:1px solid #ffffff20;border-radius:10px;overflow:hidden"></div>');
      const img = document.createElement('img');
      img.src = a.src; img.alt = 'Artwork ' + (i + 1);
      img.style.cssText = 'width:100%;height:auto;display:block;aspect-ratio:2/3;object-fit:cover';
      card.appendChild(img);
      const meta = T.el('<div class="dim" style="font-size:10.5px;padding:4px 8px">' + T.esc(a.model) + '</div>');
      card.appendChild(meta);
      const b = T.btn('Pilih & beri judul', () => pilih(i), true);
      b.style.cssText += ';margin:0 8px 8px;width:calc(100% - 16px)';
      card.appendChild(b);
      grid.appendChild(card);
    });
    hasilBox.appendChild(grid);
    hasilBox.appendChild(T.el(utils.puter.poweredBy()));
  }

  root.appendChild(T.el('<div style="font-weight:700;font-size:14px;margin:14px 0 8px">03 · Generate Artwork</div>'));
  root.appendChild(T.grid2(
    T.field('Variasi', variasi, 'Tiap variasi memotong kuota. Model cadangan dicoba otomatis bila model utama sibuk.'),
    T.field('Model image (opsional)', modelManual)
  ));
  root.appendChild(T.field('Referensi karakter (opsional)', refInp, 'JPG/PNG/WebP maks 4 MB — karakter di cover mengikuti referensi.'));
  root.appendChild(refInfo);
  root.appendChild(T.field('Arahan tambahan (opsional)', arahanTambahan));
  root.appendChild(T.row(genBtn, artSendiriBtn));
  root.appendChild(artSendiri);
  root.appendChild(statusBox);
  root.appendChild(hasilBox);

  /* ---------- 04 Editor tipografi ---------- */
  const editBox = T.out();
  const eJudul = T.input('text', 'Judul di cover');
  const ePenulis = T.input('text', 'Penulis di cover');
  const fontSel = T.select(FONTS, 'serif-editorial');
  const alignSel = T.select([['center', 'Tengah'], ['left', 'Kiri'], ['right', 'Kanan']], 'center');
  const sizeRg = T.el('<input type="range" class="inp" min="-20" max="20" value="0">');
  const colInp = document.createElement('input');
  colInp.type = 'color'; colInp.value = '#ffffff'; colInp.className = 'inp'; colInp.style.cssText = 'height:40px;padding:4px';
  const strokeCb = T.el('<label style="font-size:13px;display:flex;gap:8px;align-items:center;cursor:pointer"><input type="checkbox" style="width:16px;height:16px"> Garis tepi halus (stroke)</label>');
  const shadowCb = T.el('<label style="font-size:13px;display:flex;gap:8px;align-items:center;cursor:pointer"><input type="checkbox" checked style="width:16px;height:16px"> Bayangan lembut (shadow)</label>');
  const posRow = T.el('<div style="display:flex;gap:6px;flex-wrap:wrap"></div>');
  const canvas = document.createElement('canvas');
  let artAktif = -1, titleY = 0.09, dragJudul = false, warnaSentuh = false, planGambar = null;

  function luminansi(hex) {
    const h = /^#[0-9a-f]{6}$/i.test(hex) ? hex.slice(1) : 'ffffff';
    const c = [0, 2, 4].map((i) => {
      const v = parseInt(h.slice(i, i + 2), 16) / 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  }
  // Ukur kecerahan zona judul dari gambar agar warna teks otomatis terbaca.
  function warnaOtomatis(ctx, W, H, zona, palet) {
    try {
      const rentang = { atas: [0.04, 0.32], tengah: [0.34, 0.62], bawah: [0.66, 0.9] }[zona] || [0.04, 0.32];
      const y0 = Math.round(H * rentang[0]), hh = Math.max(1, Math.round(H * (rentang[1] - rentang[0])));
      const d = ctx.getImageData(0, y0, W, hh).data;
      let total = 0, n = 0;
      for (let i = 0; i < d.length; i += 40) { total += (d[i] * 0.2126 + d[i + 1] * 0.7152 + d[i + 2] * 0.0722) / 255; n++; }
      const cerah = n ? total / n : 0.4;
      if (cerah > 0.62) return luminansi(palet[2]) > 0.35 ? '#17131f' : palet[2];
      return luminansi(palet[0]) < 0.55 ? '#f7f1e7' : palet[0];
    } catch (e) { return '#ffffff'; }
  }
  function bungkus(ctx, text, maxW, tracking) {
    const words = String(text).split(/\s+/).filter(Boolean);
    const ukur = (t) => {
      let w = 0;
      [...t].forEach((ch, i, arr) => { w += ctx.measureText(ch).width + (i < arr.length - 1 ? tracking : 0); });
      return w;
    };
    const lines = [];
    let line = '';
    for (const w of words) {
      const t = line ? line + ' ' + w : w;
      if (line && ukur(t) > maxW) { lines.push(line); line = w; } else line = t;
    }
    if (line) lines.push(line);
    while (lines.length > 3) lines[2] += ' ' + lines.pop();
    return lines;
  }
  function teksTracking(ctx, text, x, y, tracking, maxW, stroke) {
    const chars = [...text];
    const ukur = (t) => {
      let w = 0;
      [...t].forEach((ch, i, arr) => { w += ctx.measureText(ch).width + (i < arr.length - 1 ? tracking : 0); });
      return w;
    };
    const w = Math.min(maxW, ukur(text));
    let sx = ctx.textAlign === 'left' ? x : ctx.textAlign === 'right' ? x - w : x - w / 2;
    chars.forEach((ch) => {
      if (stroke) ctx.strokeText(ch, sx, y); else ctx.fillText(ch, sx, y);
      sx += ctx.measureText(ch).width + tracking;
    });
  }

  function gambarCover() {
    if (artAktif < 0 || !artworks[artAktif]) return;
    const plan = planGambar || planAktif || rencana;
    const img = new Image();
    img.onload = () => {
      const W = 900, H = 1350;
      canvas.width = W; canvas.height = H;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, W, H);
      const palet = plan.palet || ['#ffffff', '#d7b36a', '#17131f'];
      if (!warnaSentuh) colInp.value = warnaOtomatis(ctx, W, H, plan.zona, palet);
      // Gradasi halus di area judul
      const yPct = titleY, y0 = H * yPct;
      const gr = ctx.createLinearGradient(0, Math.max(0, y0 - 140), 0, y0 + 180);
      const gelap = luminansi(colInp.value) < 0.4;
      gr.addColorStop(0, 'rgba(0,0,0,0)');
      gr.addColorStop(0.5, gelap ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.25)');
      gr.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gr;
      ctx.fillRect(0, Math.max(0, y0 - 140), W, 320);
      // Judul
      const fontKey = fontSel.value || plan.tipografi || 'serif-editorial';
      const adj = 1 + Number(sizeRg.value || 0) / 100;
      const jt0 = (eJudul.value.trim() || 'Tanpa Judul');
      const jt = (fontKey === 'sans-display' || fontKey === 'sans-bersih') && ['Action', 'Sci-Fi', 'Horror'].includes(genre.value) ? jt0.toUpperCase() : jt0;
      let size = Math.max(46, W * 0.085 * adj);
      const tracking = Math.max(1, size * (fontKey.includes('serif') ? 0.012 : 0.025));
      const maxW = W * 0.82;
      ctx.font = '700 ' + size + 'px ' + (FONT_FAM[fontKey] || FONT_FAM['serif-editorial']);
      let lines = bungkus(ctx, jt, maxW, tracking);
      while (size > 40 && (lines.length > 3 || lines.some((l) => {
        let w = 0; [...l].forEach((ch, i, arr) => { w += ctx.measureText(ch).width + (i < arr.length - 1 ? tracking : 0); });
        return w > maxW;
      }))) {
        size -= 4;
        ctx.font = '700 ' + size + 'px ' + (FONT_FAM[fontKey] || FONT_FAM['serif-editorial']);
        lines = bungkus(ctx, jt, maxW, tracking);
      }
      const align = alignSel.value || 'center';
      ctx.textAlign = align; ctx.textBaseline = 'top'; ctx.lineJoin = 'round';
      const x = align === 'left' ? W * 0.09 : align === 'right' ? W * 0.91 : W / 2;
      const lh = size * 1.08;
      const y = Math.max(H * 0.045, Math.min(H - lines.length * lh - H * 0.16, y0));
      const pakaiStroke = strokeCb.querySelector('input').checked;
      const pakaiShadow = shadowCb.querySelector('input').checked;
      if (pakaiShadow) { ctx.shadowColor = gelap ? 'rgba(0,0,0,.55)' : 'rgba(255,255,255,.36)'; ctx.shadowBlur = Math.max(3, W * 0.009); ctx.shadowOffsetY = Math.max(1, W * 0.003); }
      ctx.fillStyle = colInp.value;
      lines.forEach((ln, i) => {
        if (pakaiStroke) {
          ctx.strokeStyle = gelap ? 'rgba(0,0,0,.6)' : 'rgba(255,255,255,.55)';
          ctx.lineWidth = Math.max(1, size * 0.018);
          teksTracking(ctx, ln, x, y + i * lh, tracking, maxW, true);
        }
        teksTracking(ctx, ln, x, y + i * lh, tracking, maxW, false);
      });
      ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
      // Ornamen pemisah
      const oy = y + lines.length * lh + size * 0.16;
      const ow = Math.min(W * 0.22, size * 2.4);
      const oc = align === 'left' ? x + ow / 2 : align === 'right' ? x - ow / 2 : W / 2;
      ctx.strokeStyle = palet[1] || '#d7b36a'; ctx.globalAlpha = 0.78; ctx.lineWidth = Math.max(1, W * 0.0015);
      ctx.beginPath();
      ctx.moveTo(oc - ow / 2, oy); ctx.lineTo(oc - W * 0.012, oy);
      ctx.moveTo(oc + W * 0.012, oy); ctx.lineTo(oc + ow / 2, oy);
      ctx.stroke();
      ctx.save(); ctx.translate(oc, oy); ctx.rotate(Math.PI / 4);
      ctx.fillStyle = palet[1] || '#d7b36a';
      ctx.fillRect(-W * 0.004, -W * 0.004, W * 0.008, W * 0.008);
      ctx.restore(); ctx.globalAlpha = 1;
      // Penulis di bawah
      const pn = ePenulis.value.trim().toUpperCase();
      if (pn) {
        const ps = Math.max(18, W * 0.027), pt = Math.max(1, W * 0.0035);
        ctx.font = '600 ' + ps + 'px ' + FONT_FAM['sans-bersih'];
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.shadowColor = gelap ? 'rgba(0,0,0,.7)' : 'rgba(255,255,255,.5)';
        ctx.shadowBlur = Math.max(2, W * 0.006);
        ctx.fillStyle = colInp.value;
        teksTracking(ctx, pn, W / 2, H * 0.935, pt, W * 0.78, false);
        ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;
      }
    };
    img.src = artworks[artAktif].src;
  }

  function unduhCover(tipe) {
    gambarCover();
    setTimeout(() => {
      canvas.toBlob((b) => {
        if (!b) { T.toast('Gagal membuat file'); return; }
        const u = URL.createObjectURL(b);
        const a = document.createElement('a');
        a.href = u;
        a.download = 'cover-' + (eJudul.value.trim() || 'novel').toLowerCase().replace(/[^a-z0-9]+/gi, '-').slice(0, 40) + (tipe === 'image/png' ? '.png' : '.jpg');
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(u), 2000);
      }, tipe, tipe === 'image/jpeg' ? 0.92 : undefined);
    }, 60);
  }

  function pilih(i) {
    artAktif = i;
    planGambar = planAktif || rencana;
    warnaSentuh = false;
    titleY = ZONA_Y[planGambar.zona] || 0.09;
    eJudul.value = judul.value.trim();
    ePenulis.value = penulis.value.trim();
    fontSel.value = planGambar.tipografi || 'serif-editorial';
    alignSel.value = 'center';
    sizeRg.value = '0';
    strokeCb.querySelector('input').checked = false;
    shadowCb.querySelector('input').checked = true;
    T.show(editBox, '');
    editBox.innerHTML = '';
    editBox.appendChild(T.el('<div style="font-weight:700;font-size:14px;margin-bottom:8px">04 · Overlay Judul <span class="dim" style="font-weight:400;font-size:12px">— seret judul di gambar untuk memindahkan</span></div>'));
    editBox.appendChild(T.grid2(T.field('Judul di cover', eJudul), T.field('Penulis di cover', ePenulis)));
    editBox.appendChild(T.grid2(T.field('Font judul', fontSel), T.field('Perataan', alignSel)));
    editBox.appendChild(T.grid2(
      T.field('Ukuran judul', sizeRg, 'Geser -20 sampai +20.'),
      T.field('Warna judul', colInp)
    ));
    editBox.appendChild(T.el('<div style="font-size:13px;font-weight:700;margin:8px 0 4px">Posisi judul</div>'));
    posRow.innerHTML = '';
    [['atas', 'Atas'], ['tengah', 'Tengah'], ['bawah', 'Bawah']].forEach(([v, l]) => {
      const b = T.btn(l, () => { titleY = ZONA_Y[v]; gambarCover(); });
      posRow.appendChild(b);
    });
    editBox.appendChild(posRow);
    editBox.appendChild(T.el('<div style="height:8px"></div>'));
    editBox.appendChild(T.row(strokeCb, shadowCb));
    const cWrap = T.el('<div style="margin:10px 0"></div>');
    canvas.style.cssText = 'max-width:100%;height:auto;border-radius:10px;display:block;margin:0 auto;border:1px solid #ffffff20;cursor:move;touch-action:none';
    cWrap.appendChild(canvas);
    editBox.appendChild(cWrap);
    editBox.appendChild(T.row(
      T.btn('Unduh PNG', () => unduhCover('image/png'), true),
      T.btn('Unduh JPEG', () => unduhCover('image/jpeg'), true),
      T.btn('Konsep lain', () => { editBox.scrollIntoView({ behavior: 'smooth' }); genBtn.click(); })
    ));
    editBox.appendChild(T.el('<div class="dim" style="font-size:12px;margin-top:6px">Judul & penulis awal diambil dari Section 01 — ubah di sini bila perlu.</div>'));
    gambarCover();
    editBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  // Listener editor dipasang sekali (pilih() bisa dipanggil berulang).
  [eJudul, ePenulis, fontSel, alignSel, sizeRg, strokeCb, shadowCb].forEach((elm) => elm.addEventListener('input', gambarCover));
  colInp.addEventListener('input', () => { warnaSentuh = true; gambarCover(); });
  canvas.addEventListener('pointerdown', (e) => { dragJudul = true; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove', (e) => {
    if (!dragJudul) return;
    const b = canvas.getBoundingClientRect();
    titleY = Math.max(0.045, Math.min(0.78, (e.clientY - b.top) / b.height));
    gambarCover();
  });
  canvas.addEventListener('pointerup', () => { dragJudul = false; });
  canvas.addEventListener('pointercancel', () => { dragJudul = false; });

  root.appendChild(editBox);
  root.appendChild(T.el(utils.puter.poweredBy()));
}
