import { h as T, utils } from '../../core.js?v=6.9.20';

export const meta = {"id":"aiimage","name":"AI Image","cat":"gambar","icon":"🎨","desc":"Generate & edit gambar AI pakai akun Puter milikmu.","keywords":"ai,gambar,generator,edit foto,puter,image"};

const RATIOS = [['1:1','1:1'],['3:4','3:4'],['4:3','4:3'],['9:16','9:16'],['16:9','16:9']];
const RATIO_WH = {'1:1':[1,1],'3:4':[3,4],'4:3':[4,3],'9:16':[9,16],'16:9':[16,9]};

function dataUrlOf(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result));
    r.onerror = () => rej(new Error('gagal membaca file'));
    r.readAsDataURL(file);
  });
}

export function render(root) {
  const puter = utils.puter.panel();
  root.appendChild(puter.box);
  puter.refresh();

  const MODES = [['generate','✨ Generate'],['edit','🖌️ Edit'],['reference','🖼️ Referensi'],['multi','🧩 Multi (2–4)']];
  const modeBtns = MODES.map(([v, l]) => T.btn(l, () => setMode(v)));
  let mode = 'generate';
  const tabRow = T.row(...modeBtns);
  const setMode = (m) => {
    mode = m;
    modeBtns.forEach((b, i) => b.classList.toggle('primary', MODES[i][0] === m));
    [editWrap, refWrap, multiWrap].forEach((w) => { w.style.display = 'none'; });
    if (m === 'edit') editWrap.style.display = '';
    if (m === 'reference') refWrap.style.display = '';
    if (m === 'multi') multiWrap.style.display = '';
  };

  const prompt = T.ta(4, 'Deskripsikan gambar yang kamu mau… (Inggris biasanya hasilnya lebih bagus)');
  const modelSel = T.select([['', '✨ Otomatis (pilihan Puter)']], '');
  const modelManual = T.input('text', '…atau tulis ID model manual (opsional)');
  modelManual.style.display = 'none';
  const ratioSel = T.select(RATIOS, '1:1');
  const instruksi = T.ta(3, 'Instruksi edit, mis. "ganti background jadi pantai sunset"');
  const refPrompt = T.ta(3, 'Prompt — gaya/karakter mengikuti gambar referensi');

  const fileBtn = (label, multiple) => {
    const w = T.el('<div></div>');
    const inp = document.createElement('input');
    inp.type = 'file'; inp.accept = 'image/png,image/jpeg,image/webp'; if (multiple) inp.multiple = true;
    inp.className = 'inp'; inp.style.marginBottom = '6px';
    const info = T.el('<div class="dim" style="font-size:12px"></div>');
    inp.addEventListener('change', () => {
      const fs = [...inp.files];
      info.textContent = fs.length ? fs.map((f) => f.name + ' (' + Math.round(f.size / 1024) + ' KB)').join(', ') : '';
    });
    w.appendChild(T.el('<div class="dim" style="font-size:12.5px;margin-bottom:4px">' + label + '</div>'));
    w.appendChild(inp); w.appendChild(info);
    w._input = inp;
    return w;
  };
  const editWrap = fileBtn('Gambar yang mau diedit (1 gambar, maks 10 MB)');
  const refWrap = fileBtn('Gambar referensi (1 gambar)');
  const multiWrap = fileBtn('Gambar referensi (2–4 gambar)');
  editWrap.style.display = 'none'; refWrap.style.display = 'none'; multiWrap.style.display = 'none';

  const out = T.out();
  let busy = false;
  const genBtn = T.btn('🎨 Generate', () => jalan(), true);

  const muatModel = T.btn('🔄 Muat daftar model', async () => {
    await puter.need(async () => {
      // Puter tidak mengekspos daftar model image yang seragam via listModels;
      // sediakan pilihan umum yang dikenal + kolom ID manual. Jujur di UI.
      modelSel.innerHTML = '';
      [['', '✨ Otomatis (pilihan Puter)'],['gpt-image-1','GPT Image'],['nano-banana','Nano Banana (Gemini)'],['grok-2-image','Grok Image'],['flux-1-schnell','FLUX Schnell']].forEach(([v, l]) => {
        const o = document.createElement('option'); o.value = v; o.textContent = l; modelSel.appendChild(o);
      });
      modelManual.style.display = '';
      T.show(out, '<div class="dim center">Daftar model umum dimuat. Bila model gagal / tidak dikenal, biarkan "Otomatis" atau tulis ID manual yang kamu tahu pasti.</div>');
    });
  });

  function kumpulInput() {
    const filesOf = (w, min, max, label) => {
      const fs = [...w._input.files];
      if (fs.length < min) { T.show(out, '<span class="warn">' + label + ': pilih ' + min + ' gambar dulu ya.</span>'); return null; }
      const pakai = fs.slice(0, max);
      for (const f of pakai) {
        if (f.size > 10 * 1024 * 1024) { T.show(out, '<span class="err">"' + T.esc(f.name) + '" lebih dari 10 MB.</span>'); return null; }
        if (!/^image\//.test(f.type)) { T.show(out, '<span class="err">"' + T.esc(f.name) + '" bukan file gambar.</span>'); return null; }
      }
      return pakai;
    };
    let p, inputs = [];
    if (mode === 'generate') {
      p = prompt.value.trim();
      if (!p) { T.show(out, '<span class="warn">Isi dulu deskripsi gambarnya.</span>'); return null; }
    } else if (mode === 'edit') {
      const fs = filesOf(editWrap, 1, 1, 'Mode edit'); if (!fs) return null;
      p = instruksi.value.trim();
      if (!p) { T.show(out, '<span class="warn">Isi dulu instruksi editnya.</span>'); return null; }
      inputs = fs;
    } else if (mode === 'reference') {
      const fs = filesOf(refWrap, 1, 1, 'Mode referensi'); if (!fs) return null;
      p = refPrompt.value.trim();
      if (!p) { T.show(out, '<span class="warn">Isi dulu prompt-nya.</span>'); return null; }
      inputs = fs;
    } else {
      const fs = filesOf(multiWrap, 2, 4, 'Mode multi'); if (!fs) return null;
      if (fs.length < 2) { T.show(out, '<span class="warn">Mode multi butuh minimal 2 gambar.</span>'); return null; }
      p = prompt.value.trim();
      if (!p) { T.show(out, '<span class="warn">Isi dulu deskripsi gambarnya.</span>'); return null; }
      inputs = fs;
    }
    return { prompt: p, inputs };
  }

  async function jalan() {
    if (busy) return;
    const k = kumpulInput();
    if (!k) return;
    await puter.need(async () => {
      busy = true; genBtn.disabled = true;
      T.show(out, '<div class="dim center">🎨 Menggambar… (bisa makan waktu 1–2 menit)</div>');
      try {
        const datas = [];
        for (const f of k.inputs) datas.push(await dataUrlOf(f));
        const [rw, rh] = RATIO_WH[ratioSel.value] || [1, 1];
        const modelId = modelManual.value.trim() || modelSel.value;
        const opts = { ratio: { w: rw, h: rh } };
        if (modelId) opts.model = modelId;
        if (datas.length === 1) { opts.input_image = datas[0]; opts.input_image_mime_type = k.inputs[0].type; }
        else if (datas.length > 1) { opts.input_images = datas; }
        const res = await window.puter.ai.txt2img(k.prompt, opts);
        const src = utils.puter.srcOf(res);
        if (!src) throw new Error('Puter tidak mengembalikan gambar.');
        T.show(out, '');
        const img = document.createElement('img');
        img.src = src; img.alt = 'Hasil AI Image';
        img.style.cssText = 'max-width:100%;height:auto;border-radius:10px;display:block;margin:0 auto';
        out.appendChild(img);
        const rw2 = T.el('<div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap;justify-content:center"></div>');
        rw2.appendChild(T.btn('⬇️ Unduh PNG', () => utils.dlUrl(src, 'ai-image-' + Date.now() + '.png'), true));
        rw2.appendChild(T.btn('🔗 Buka ukuran penuh', () => window.open(src, '_blank', 'noopener')));
        out.appendChild(rw2);
        out.appendChild(T.el(utils.puter.poweredBy()));
      } catch (e) {
        const m = (e && (e.message || e.error)) || e;
        T.show(out, '<span class="err">Gagal generate: ' + T.esc(String(m).slice(0, 300)) + '</span><br><span class="dim">Kemungkinan: kuota Puter habis, model tidak tersedia, atau koneksi bermasalah.</span>');
      } finally { busy = false; genBtn.disabled = false; }
    });
  }

  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Generate & edit gambar AI — <b>pakai akun Puter milikmu</b> (login gratis). Kuota AI dipotong dari akunmu sendiri.</p>'));
  root.appendChild(tabRow);
  root.appendChild(T.field('Deskripsi gambar (prompt)', prompt));
  const advMode = T.el('<details style="margin-bottom:10px"><summary style="cursor:pointer;font-size:13px">⚙️ Model & rasio</summary><div style="margin-top:8px"></div></details>');
  const advBody = advMode.querySelector('div');
  advBody.appendChild(T.field('Model', modelSel));
  advBody.appendChild(T.field('ID model manual', modelManual, 'Opsional — untuk ID model yang tidak ada di daftar.'));
  advBody.appendChild(T.field('Rasio', ratioSel, 'Catatan jujur: tidak semua model menghormati rasio; ada yang selalu 1:1.'));
  advBody.appendChild(muatModel);
  root.appendChild(advMode);
  root.appendChild(editWrap); root.appendChild(refWrap); root.appendChild(multiWrap);
  root.appendChild(T.el('<div id="aiimage-instruksi"></div>'));
  root.querySelector('#aiimage-instruksi').replaceWith(T.field('Instruksi edit', instruksi), T.field('Prompt referensi', refPrompt));
  // Tampilkan instruksi sesuai mode
  const syncInstruksi = () => {
    instruksi.closest('.fld').style.display = mode === 'edit' ? '' : 'none';
    refPrompt.closest('.fld').style.display = mode === 'reference' ? '' : 'none';
    prompt.closest('.fld').style.display = (mode === 'generate' || mode === 'multi') ? '' : 'none';
  };
  const _setMode = setMode;
  // bungkus ulang agar sinkron dengan instruksi
  modeBtns.forEach((b, i) => b.addEventListener('click', () => { _setMode(MODES[i][0]); syncInstruksi(); }));
  root.appendChild(T.row(genBtn));
  root.appendChild(out);
  syncInstruksi();
}
