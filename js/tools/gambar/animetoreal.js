import { h as T, utils } from '../../core.js?v=6.9.20';

export const meta = {"id":"animetoreal","name":"Anime to Real","cat":"gambar","icon":"🧑‍🎨","desc":"Ubah ilustrasi anime jadi foto realistik via akun Puter milikmu.","keywords":"anime,realistik,foto,ai,konversi,puter"};

// Kecilkan gambar client-side: sisi terpanjang maks 1600px (seperti perilaku asli)
function siapkanGambar(file) {
  return new Promise((res, rej) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        const MAX = 1600;
        let { width: w, height: h } = img;
        if (Math.max(w, h) > MAX) {
          const k = MAX / Math.max(w, h);
          w = Math.round(w * k); h = Math.round(h * k);
        }
        const c = document.createElement('canvas');
        c.width = w; c.height = h;
        c.getContext('2d').drawImage(img, 0, 0, w, h);
        URL.revokeObjectURL(url);
        res(c.toDataURL('image/jpeg', 0.86));
      } catch (e) { URL.revokeObjectURL(url); rej(e); }
    };
    img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('gagal membaca gambar')); };
    img.src = url;
  });
}

export function render(root) {
  const puter = utils.puter.panel();
  root.appendChild(puter.box);
  puter.refresh();

  const urlInp = T.input('url', 'https://… (link file gambar langsung)');
  urlInp.maxLength = 4096;
  const pasteBtn = T.btn('📋 Tempel', async () => {
    try {
      const t = await navigator.clipboard.readText();
      if (t) urlInp.value = t.trim();
    } catch (e) { T.toast('Clipboard tidak bisa dibaca'); }
  });
  const fileInp = document.createElement('input');
  fileInp.type = 'file'; fileInp.accept = 'image/jpeg,image/png,image/webp'; fileInp.className = 'inp';
  const fileInfo = T.el('<div class="dim" style="font-size:12px;margin-top:4px"></div>');
  fileInp.addEventListener('change', () => {
    const f = fileInp.files[0];
    fileInfo.textContent = f ? f.name + ' (' + Math.round(f.size / 1024) + ' KB)' : '';
  });

  const out = T.out();
  let busy = false;
  let srcAsli = ''; // dataURL untuk panel ORIGINAL
  const goBtn = T.btn('✨ Ubah jadi realistik', () => jalan(), true);

  async function ambilSumber() {
    const f = fileInp.files[0];
    if (f) {
      if (f.size > 12 * 1024 * 1024) throw new Error('File maksimal 12 MB.');
      if (!/^image\/(jpeg|png|webp)$/.test(f.type)) throw new Error('Format harus JPG/PNG/WEBP.');
      return await siapkanGambar(f);
    }
    const u = urlInp.value.trim();
    if (!u) throw new Error('Pilih file atau tempel URL gambar dulu.');
    if (!/^https?:\/\//i.test(u)) throw new Error('URL harus diawali http(s)://');
    // Coba ambil langsung; gagal (CORS) → beri pesan jujur
    let r;
    try { r = await fetch(u); }
    catch (e) { throw new Error('URL tidak bisa diambil (kemungkinan diblokir CORS). Unduh gambarnya lalu upload sebagai file.'); }
    if (!r.ok) throw new Error('URL gambar tidak bisa diakses (HTTP ' + r.status + ').');
    const b = await r.blob();
    if (!/^image\//.test(b.type)) throw new Error('URL itu bukan file gambar langsung (terdeteksi: ' + (b.type || 'tak dikenal') + '). Pakai link file gambar, bukan halaman web.');
    if (b.size > 12 * 1024 * 1024) throw new Error('Gambar dari URL melebihi 12 MB.');
    return await siapkanGambar(new File([b], 'gambar', { type: b.type }));
  }

  async function jalan() {
    if (busy) return;
    await puter.need(async () => {
      busy = true; goBtn.disabled = true;
      T.show(out, '<div class="dim center">🎨 AI sedang mengonversi… (maks ~65 detik)</div>');
      try {
        srcAsli = await ambilSumber();
        const prompt = 'Convert this anime illustration into a photorealistic photograph. Keep the same composition, pose, colors and mood; realistic skin, natural lighting, photographic detail. Output photo only.';
        const res = await window.puter.ai.txt2img(prompt, { input_image: srcAsli, input_image_mime_type: 'image/jpeg' });
        const src = utils.puter.srcOf(res);
        if (!src) throw new Error('Puter tidak mengembalikan gambar.');
        T.show(out, '');
        const grid = T.el('<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px"></div>');
        [['ORIGINAL', srcAsli], ['HASIL REALISTIK', src]].forEach(([label, s]) => {
          const card = T.el('<div style="border:1px solid #ffffff20;border-radius:10px;overflow:hidden"></div>');
          card.appendChild(T.el('<div class="dim" style="font-size:11.5px;font-weight:700;padding:6px 8px;letter-spacing:.5px">' + label + '</div>'));
          const img = document.createElement('img');
          img.src = s; img.alt = label;
          img.style.cssText = 'width:100%;height:auto;display:block';
          card.appendChild(img);
          grid.appendChild(card);
        });
        out.appendChild(grid);
        const rw = T.el('<div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap;justify-content:center"></div>');
        rw.appendChild(T.btn('⬇️ Unduh hasil', () => utils.dlUrl(src, 'anime-to-real-' + Date.now() + '.png'), true));
        rw.appendChild(T.btn('🔄 Konversi lain', () => { T.hide(out); fileInp.value = ''; urlInp.value = ''; fileInfo.textContent = ''; }));
        out.appendChild(rw);
        out.appendChild(T.el(utils.puter.poweredBy()));
      } catch (e) {
        T.show(out, '<span class="err">' + T.esc(String((e && (e.message || e.error)) || e).slice(0, 300)) + '</span>');
      } finally { busy = false; goBtn.disabled = false; }
    });
  }

  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Upload ilustrasi anime (atau tempel URL file gambar) → AI mengubahnya jadi foto realistik. ' +
    'Pakai <b>akun Puter milikmu</b>. Gambar diperkecil otomatis (sisi maks 1600px) agar hemat kuota.</p>'));
  const uf = T.field('URL gambar', urlInp, 'Link file gambar langsung — bukan halaman Pinterest/Google.');
  uf.appendChild(T.el('<div style="height:6px"></div>'));
  uf.appendChild(pasteBtn);
  root.appendChild(uf);
  root.appendChild(T.el('<div class="dim center" style="margin:8px 0;font-size:12.5px">— atau —</div>'));
  const ff = T.field('Upload gambar', fileInp, 'JPG/PNG/WEBP, maks 12 MB.');
  ff.appendChild(fileInfo);
  root.appendChild(ff);
  root.appendChild(T.row(goBtn));
  root.appendChild(out);
}
