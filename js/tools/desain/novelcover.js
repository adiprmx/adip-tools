import { h as T, utils } from '../../core.js?v=6.9.20';

export const meta = {"id":"novelcover","name":"Novel Cover","cat":"desain","icon":"📕","desc":"Buat cover novel AI dari sinopsis + overlay judul.","keywords":"novel,cover,sampul,buku,ai,desain,puter"};

const GENRES = ['Fantasy','Romance','Villainess','Yuri','Academy','Isekai','Action','Dark Fantasy','Sci-Fi','Mystery','Horror','Modern Fantasy'];
// Template arahan seni per genre (fallback jujur bila AI director tidak dipakai)
const GENRE_TPL = {
  'Fantasy': { palet: 'biru malam + emas', komposisi: 'hero di tengah, kastil/medan perang di latar', zona: 'judul di sepertiga atas' },
  'Romance': { palet: 'pastel hangat (peach, rose)', komposisi: 'dua siluet berhadapan, bunga/bokeh', zona: 'judul di tengah atas' },
  'Villainess': { palet: 'ungu royal + hitam + aksen emas', komposisi: 'wanita anggun menatap tajam, istana gelap', zona: 'judul di atas' },
  'Yuri': { palet: 'pink lembut + putih + lavender', komposisi: 'dua gadis berdampingan, kelopak bunga', zona: 'judul di tengah' },
  'Academy': { palet: 'biru cerah + putih', komposisi: 'gedung sekolah sihir, murid berbaris', zona: 'judul di atas' },
  'Isekai': { palet: 'cyan portal + oranye senja', komposisi: 'gerbang portal raksasa, dunia ganda', zona: 'judul di atas' },
  'Action': { palet: 'merah + hitam + oranye api', komposisi: 'pose dinamis, efek ledakan/energi', zona: 'judul besar di tengah' },
  'Dark Fantasy': { palet: 'hitam + merah darah + abu', komposisi: 'figur berjubah, bulan merah, reruntuhan', zona: 'judul di bawah' },
  'Sci-Fi': { palet: 'cyan neon + biru tua', komposisi: 'kota futuristik / luar angkasa, kapal', zona: 'judul di atas' },
  'Mystery': { palet: 'abu gelap + kuning lampu', komposisi: 'siluet detektif, jalanan hujan malam', zona: 'judul di tengah' },
  'Horror': { palet: 'hitam + merah + putih pucat', komposisi: 'bayangan mengancam, rumah tua', zona: 'judul besar di tengah' },
  'Modern Fantasy': { palet: 'ungu kota + teal', komposisi: 'kota modern dengan sihir menyala', zona: 'judul di atas' },
};
const FONTS = [
  ['serif', 'Serif klasik (Georgia)'],
  ['sans', 'Sans bersih (system)'],
  ['display', 'Display tebal (system bold)'],
];
const FONT_FAM = {
  serif: 'Georgia, "Times New Roman", serif',
  sans: 'system-ui, -apple-system, "Segoe UI", sans-serif',
  display: '"Arial Black", system-ui, sans-serif',
};

export function render(root) {
  const puter = utils.puter.panel();
  root.appendChild(puter.box);
  puter.refresh();

  /* ---------- 01 Detail novel ---------- */
  const judul = T.input('text', 'Judul novel…');
  const penulis = T.input('text', 'Nama penulis…');
  const genre = T.select(GENRES.map((g) => [g, g]), 'Fantasy');
  const sinopsis = T.ta(5, 'Tulis sinopsis novelmu (wajib, maks 3000 karakter)…');
  sinopsis.maxLength = 3000;
  const karakter = T.ta(2, 'Deskripsi karakter utama (opsional)…');

  root.appendChild(T.el('<div style="font-weight:700;font-size:14px;margin:4px 0 8px">📖 01 · Detail Novel</div>'));
  root.appendChild(T.grid2(T.field('Judul', judul), T.field('Penulis', penulis)));
  root.appendChild(T.field('Genre', genre));
  root.appendChild(T.field('Sinopsis', sinopsis));
  root.appendChild(T.field('Karakter utama (opsional)', karakter));

  /* ---------- Arahan seni ---------- */
  const arahBox = T.out();
  let arah = null; // {sumber, palet, komposisi, zona, tipografi}
  const arahAI = T.btn('✨ Minta arahan AI', async () => {
    const s = sinopsis.value.trim();
    if (!s) { T.show(arahBox, '<span class="warn">Isi dulu sinopsisnya.</span>'); return; }
    await puter.need(async () => {
      T.show(arahBox, '<div class="dim center">🎨 AI menyusun arahan seni…</div>');
      try {
        const g = genre.value;
        const prompt = 'Kamu art director cover novel. Genre: ' + g + '. Sinopsis: ' + s.slice(0, 1500) +
          (karakter.value.trim() ? ' Karakter utama: ' + karakter.value.trim().slice(0, 500) : '') +
          '. Jawab SINGKAT dalam format persis 4 baris:\nPALET: ...\nKOMPOSISI: ...\nZONA JUDUL: ...\nTIPOGRAFI: ...';
        const res = await window.puter.ai.chat(prompt, {});
        const txt = (typeof res === 'string' ? res : (res && (res.text || res.content)) || '').trim() || String(res);
        const ambil = (k) => { const m = new RegExp(k + ':\\s*(.+)', 'i').exec(txt); return m ? m[1].trim() : '-'; };
        arah = { sumber: 'AI (akun Putermu)', palet: ambil('PALET'), komposisi: ambil('KOMPOSISI'), zona: ambil('ZONA JUDUL'), tipografi: ambil('TIPOGRAFI') };
      } catch (e) {
        arah = null;
        T.show(arahBox, '<span class="err">Gagal meminta arahan AI — pakai template genre di bawah sebagai fallback.</span>');
      }
      paintArah();
    });
  });
  const arahTpl = T.btn('📋 Pakai template genre', () => {
    const t = GENRE_TPL[genre.value] || GENRE_TPL.Fantasy;
    arah = { sumber: 'Template genre (bukan AI)', palet: t.palet, komposisi: t.komposisi, zona: t.zona, tipografi: 'Serif tebal untuk fantasy/horror, sans bersih untuk modern' };
    paintArah();
  });
  function paintArah() {
    if (!arah) { T.hide(arahBox); return; }
    T.show(arahBox,
      '<div style="border:1px solid #ffffff20;border-radius:10px;padding:10px">' +
      '<div style="font-weight:700;font-size:13px;margin-bottom:6px">🎨 Arahan seni <span class="dim" style="font-weight:400">(' + T.esc(arah.sumber) + ')</span></div>' +
      '<table style="width:100%;border-collapse:collapse;font-size:12.5px">' +
      [['Palet', arah.palet], ['Komposisi', arah.komposisi], ['Zona judul', arah.zona], ['Tipografi', arah.tipografi]]
        .map(([k, v]) => '<tr><td style="padding:5px 8px 5px 0;color:#c9bda9;white-space:nowrap;vertical-align:top">' + T.esc(k) + '</td><td style="padding:5px 0">' + T.esc(v) + '</td></tr>').join('') +
      '</table></div>');
  }
  root.appendChild(T.el('<div style="font-weight:700;font-size:14px;margin:14px 0 8px">🎨 02 · Arahan Seni</div>'));
  root.appendChild(T.row(arahAI, arahTpl));
  root.appendChild(arahBox);

  /* ---------- 03 Generate artwork ---------- */
  const variasi = T.select([['1', '1'], ['2', '2'], ['4', '4']], '1');
  const modelManual = T.input('text', 'ID model image (opsional, kosongkan = otomatis)');
  const refInp = document.createElement('input');
  refInp.type = 'file'; refInp.accept = 'image/jpeg,image/png,image/webp'; refInp.className = 'inp';
  const hasilBox = T.out();
  let busy = false;
  let artworks = []; // dataURL list

  const genBtn = T.btn('🖼️ Generate cover', async () => {
    if (busy) return;
    const s = sinopsis.value.trim();
    if (!s) { T.show(hasilBox, '<span class="warn">Isi dulu sinopsisnya.</span>'); return; }
    const n = parseInt(variasi.value, 10) || 1;
    await puter.need(async () => {
      busy = true; genBtn.disabled = true;
      artworks = [];
      T.show(hasilBox, '<div class="dim center">🖼️ Menggambar ' + n + ' artwork… (bisa 1–3 menit)</div>');
      try {
        const g = genre.value;
        const tpl = GENRE_TPL[g] || GENRE_TPL.Fantasy;
        const dir = arah ? ('Art direction: palet ' + arah.palet + '; komposisi ' + arah.komposisi + '. ') : '';
        const prompt = 'Epic ' + g + ' novel book cover art, portrait 2:3. ' + dir +
          'Visual: ' + tpl.komposisi + '. Palette: ' + tpl.palet + '. ' +
          'Story mood: ' + s.slice(0, 800) +
          (karakter.value.trim() ? ' Main character: ' + karakter.value.trim().slice(0, 300) : '') +
          ' IMPORTANT: no text, no words, no letters, no watermark — clean illustration only.';
        const opts = { ratio: { w: 2, h: 3 } };
        if (modelManual.value.trim()) opts.model = modelManual.value.trim();
        const f = refInp.files[0];
        if (f) {
          const du = await new Promise((res, rej) => {
            const r = new FileReader();
            r.onload = () => res(String(r.result)); r.onerror = () => rej(new Error('gagal baca referensi'));
            r.readAsDataURL(f);
          });
          opts.input_image = du; opts.input_image_mime_type = f.type;
        }
        for (let i = 0; i < n; i++) {
          T.show(hasilBox, '<div class="dim center">🖼️ Menggambar ' + (i + 1) + '/' + n + '…</div>');
          const res = await window.puter.ai.txt2img(prompt, opts);
          const src = utils.puter.srcOf(res);
          if (src) artworks.push(src);
        }
        if (!artworks.length) throw new Error('Puter tidak mengembalikan gambar.');
        paintHasil();
      } catch (e) {
        T.show(hasilBox, '<span class="err">Gagal: ' + T.esc(String((e && (e.message || e.error)) || e).slice(0, 250)) + '</span>');
      } finally { busy = false; genBtn.disabled = false; }
    });
  }, true);

  function paintHasil() {
    T.show(hasilBox, '');
    const grid = T.el('<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px"></div>');
    artworks.forEach((src, i) => {
      const card = T.el('<div style="border:1px solid #ffffff20;border-radius:10px;overflow:hidden"></div>');
      const img = document.createElement('img');
      img.src = src; img.alt = 'Artwork ' + (i + 1);
      img.style.cssText = 'width:100%;height:auto;display:block;aspect-ratio:2/3;object-fit:cover';
      card.appendChild(img);
      const b = T.btn('✏️ Pilih & beri judul', () => pilih(i), true);
      b.style.cssText += ';margin:8px;width:calc(100% - 16px)';
      card.appendChild(b);
      grid.appendChild(card);
    });
    hasilBox.appendChild(grid);
    hasilBox.appendChild(T.el(utils.puter.poweredBy()));
  }

  root.appendChild(T.el('<div style="font-weight:700;font-size:14px;margin:14px 0 8px">🖼️ 03 · Generate Artwork</div>'));
  root.appendChild(T.grid2(
    T.field('Variasi', variasi, 'Tiap variasi memotong kuota.'),
    T.field('Model image (opsional)', modelManual)
  ));
  root.appendChild(T.field('Referensi karakter (opsional)', refInp, 'JPG/PNG/WEBP — karakter di cover mengikuti referensi.'));
  root.appendChild(T.row(genBtn));
  root.appendChild(hasilBox);

  /* ---------- 04 Editor tipografi ---------- */
  const editBox = T.out();
  const fontSel = T.select(FONTS, 'serif');
  const sizeRg = T.el('<input type="range" class="inp" min="24" max="120" value="64">');
  const yRg = T.el('<input type="range" class="inp" min="4" max="92" value="12">');
  const colInp = document.createElement('input');
  colInp.type = 'color'; colInp.value = '#ffffff'; colInp.className = 'inp'; colInp.style.cssText = 'height:40px;padding:4px';
  const canvas = document.createElement('canvas');
  let artAktif = -1;

  function wrap(ctx, text, maxW) {
    const words = String(text).split(/\s+/).filter(Boolean);
    const lines = [];
    let line = '';
    for (const w of words) {
      const t = line ? line + ' ' + w : w;
      if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; }
      else line = t;
    }
    if (line) lines.push(line);
    return lines.slice(0, 4);
  }

  function gambarCover() {
    if (artAktif < 0 || !artworks[artAktif]) return;
    const img = new Image();
    img.onload = () => {
      const W = 900, Hh = 1350;
      canvas.width = W; canvas.height = Hh;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, W, Hh);
      // gradasi halus di area judul agar teks terbaca
      const yPct = +yRg.value / 100;
      const y0 = Hh * yPct;
      const gr = ctx.createLinearGradient(0, y0 - 120, 0, y0 + 160);
      gr.addColorStop(0, 'rgba(0,0,0,0)');
      gr.addColorStop(0.5, 'rgba(0,0,0,0.45)');
      gr.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gr;
      ctx.fillRect(0, Math.max(0, y0 - 120), W, 280);
      const size = +sizeRg.value;
      ctx.fillStyle = colInp.value;
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 12;
      const jt = judul.value.trim() || 'Tanpa Judul';
      ctx.font = '700 ' + size + 'px ' + FONT_FAM[fontSel.value];
      const lines = wrap(ctx, jt.toUpperCase(), W - 80);
      const lh = size * 1.12;
      let y = y0 - ((lines.length - 1) * lh) / 2;
      lines.forEach((ln) => { ctx.fillText(ln, W / 2, y); y += lh; });
      const pn = penulis.value.trim();
      if (pn) {
        ctx.font = '400 ' + Math.round(size * 0.38) + 'px ' + FONT_FAM.sans;
        ctx.shadowBlur = 8;
        ctx.fillText(pn.toUpperCase(), W / 2, y + size * 0.5);
      }
      ctx.shadowBlur = 0;
    };
    img.src = artworks[artAktif];
  }

  function pilih(i) {
    artAktif = i;
    T.show(editBox, '');
    editBox.appendChild(T.el('<div style="font-weight:700;font-size:14px;margin-bottom:8px">✏️ 04 · Overlay Judul</div>'));
    editBox.appendChild(T.grid2(
      T.field('Font judul', fontSel),
      T.field('Warna judul', colInp)
    ));
    editBox.appendChild(T.grid2(
      T.field('Ukuran judul (' + sizeRg.value + 'px)', sizeRg),
      T.field('Posisi judul (' + yRg.value + '%)', yRg)
    ));
    const cWrap = T.el('<div style="margin:10px 0"></div>');
    canvas.style.cssText = 'max-width:100%;height:auto;border-radius:10px;display:block;margin:0 auto;border:1px solid #ffffff20';
    cWrap.appendChild(canvas);
    editBox.appendChild(cWrap);
    const dlBtn = T.btn('⬇️ Unduh cover final (PNG)', () => {
      canvas.toBlob((b) => {
        if (!b) { T.toast('Gagal membuat PNG'); return; }
        const u = URL.createObjectURL(b);
        const a = document.createElement('a');
        a.href = u; a.download = 'cover-' + (judul.value.trim() || 'novel').toLowerCase().replace(/[^a-z0-9]+/gi, '-').slice(0, 40) + '.png';
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(u), 2000);
      }, 'image/png');
    }, true);
    editBox.appendChild(T.row(dlBtn));
    editBox.appendChild(T.el('<div class="dim" style="font-size:12px;margin-top:6px">Judul & penulis diambil dari Section 01 — ubah di sana lalu geser slider untuk refresh.</div>'));
    [fontSel, sizeRg, yRg, colInp, judul, penulis].forEach((elm) => elm.addEventListener('input', gambarCover));
    sizeRg.addEventListener('input', () => { sizeRg.closest('.fld').querySelector('label').textContent = 'Ukuran judul (' + sizeRg.value + 'px)'; });
    yRg.addEventListener('input', () => { yRg.closest('.fld').querySelector('label').textContent = 'Posisi judul (' + yRg.value + '%)'; });
    gambarCover();
    editBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  root.appendChild(editBox);
}
