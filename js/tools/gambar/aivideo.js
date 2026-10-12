import { h as T, utils } from '../../core.js?v=6.9.20';

export const meta = {"id":"aivideo","name":"AI Video","cat":"gambar","icon":"🎬","desc":"Generate video AI (teks/gambar jadi video) pakai akun Puter milikmu.","keywords":"ai,video,generator,sora,veo,puter"};

// Durasi valid per model (dari perilaku tool asli; nilai di luar ini diabaikan Puter)
const MODEL_DUR = {
  '': [4, 8],
  'sora-2': [4, 8, 12],
  'sora-2-pro': [4, 8, 12],
  'veo-3.1-fast-generate-preview': [4, 6, 8],
  'veo-3.1-generate-preview': [4, 6, 8],
};
const RATIO_SIZE = { '9:16': '720x1280', '16:9': '1280x720' };

export function render(root) {
  const puter = utils.puter.panel();
  root.appendChild(puter.box);
  puter.refresh();

  const prompt = T.ta(4, 'Deskripsikan videonya… (maks 3000 karakter)');
  prompt.maxLength = 3000;
  const modelSel = T.select([
    ['', '✨ Otomatis (pilihan Puter)'],
    ['sora-2', 'Sora 2'],
    ['sora-2-pro', 'Sora 2 Pro'],
    ['veo-3.1-fast-generate-preview', 'Veo 3.1 Fast'],
    ['veo-3.1-generate-preview', 'Veo 3.1'],
  ], '');
  const durSel = T.select([], '');
  const ratioSel = T.select([['9:16', '9:16 (vertikal)'], ['16:9', '16:9 (lanskap)']], '9:16');

  const syncDur = () => {
    const ds = MODEL_DUR[modelSel.value] || [4, 8];
    durSel.innerHTML = '';
    ds.forEach((d) => {
      const o = document.createElement('option');
      o.value = String(d); o.textContent = d + ' detik';
      durSel.appendChild(o);
    });
  };
  modelSel.addEventListener('change', syncDur);
  syncDur();

  const fileInp = document.createElement('input');
  fileInp.type = 'file'; fileInp.accept = 'image/jpeg,image/png,image/webp'; fileInp.className = 'inp';
  const fileInfo = T.el('<div class="dim" style="font-size:12px;margin-top:4px"></div>');
  fileInp.addEventListener('change', () => {
    const f = fileInp.files[0];
    fileInfo.textContent = f ? f.name + ' (' + Math.round(f.size / 1024) + ' KB)' : '';
  });

  const out = T.out();
  let busy = false;
  const genBtn = T.btn('🎬 Generate video', () => jalan(), true);

  async function jalan() {
    if (busy) return;
    const p = prompt.value.trim();
    if (!p) { T.show(out, '<span class="warn">Isi dulu deskripsi videonya.</span>'); return; }
    const f = fileInp.files[0];
    if (f) {
      if (f.size > 10 * 1024 * 1024) { T.show(out, '<span class="err">Gambar referensi maksimal 10 MB.</span>'); return; }
      if (!/^image\//.test(f.type)) { T.show(out, '<span class="err">File referensi harus gambar (JPG/PNG/WEBP).</span>'); return; }
    }
    await puter.need(async () => {
      busy = true; genBtn.disabled = true;
      T.show(out, '<div class="dim center">🎬 Merender video…<br><span style="font-size:12px">Video AI bisa makan waktu 5–15 menit. Jangan tutup halaman ini.</span></div>');
      try {
        const opts = { seconds: parseInt(durSel.value, 10) || 4, size: RATIO_SIZE[ratioSel.value] || '720x1280' };
        if (modelSel.value) opts.model = modelSel.value;
        if (f) {
          const du = await new Promise((res, rej) => {
            const r = new FileReader();
            r.onload = () => res(String(r.result)); r.onerror = () => rej(new Error('gagal membaca gambar'));
            r.readAsDataURL(f);
          });
          opts.input_reference = du;
        }
        const res = await window.puter.ai.txt2vid(p, opts);
        const src = utils.puter.srcOf(res);
        if (!src) throw new Error('Puter tidak mengembalikan video.');
        T.show(out, '');
        const v = document.createElement('video');
        v.src = src; v.controls = true; v.playsInline = true;
        v.style.cssText = 'max-width:100%;border-radius:10px;display:block;margin:0 auto';
        out.appendChild(v);
        const rw = T.el('<div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap;justify-content:center"></div>');
        rw.appendChild(T.btn('⬇️ Unduh video', () => utils.dlUrl(src, 'ai-video-' + Date.now() + '.mp4'), true));
        out.appendChild(rw);
        out.appendChild(T.el(utils.puter.poweredBy()));
      } catch (e) {
        const m = (e && (e.message || e.error)) || e;
        T.show(out, '<span class="err">Gagal generate: ' + T.esc(String(m).slice(0, 300)) + '</span><br><span class="dim">Kemungkinan: kuota Puter habis, model sibuk, atau koneksi putus.</span>');
      } finally { busy = false; genBtn.disabled = false; }
    });
  }

  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Ubah teks atau gambar jadi video AI — <b>pakai akun Puter milikmu</b>. ' +
    'Catatan jujur: video AI memakan kuota besar (mis. Sora ±$0,10/detik dipotong dari allowance akunmu).</p>'));
  root.appendChild(T.field('Deskripsi video (prompt)', prompt));
  root.appendChild(T.grid2(
    T.field('Model', modelSel),
    T.field('Durasi', durSel, 'Opsi durasi menyesuaikan model.')
  ));
  root.appendChild(T.field('Rasio', ratioSel));
  const fw = T.field('Gambar referensi (opsional — image-to-video)', fileInp, 'JPG/PNG/WEBP, maks 10 MB. Kosongkan untuk text-to-video murni.');
  fw.appendChild(fileInfo);
  root.appendChild(fw);
  root.appendChild(T.row(genBtn));
  root.appendChild(out);
}
