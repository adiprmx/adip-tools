import { h as T, utils } from '../../core.js?v=6.5.0';

export const meta = {"id": "image-base64", "name": "Gambar ke Base64", "cat": "converter", "icon": "🖼️", "desc": "Gambar jadi string Base64 siap embed.", "keywords": "gambar,base64,foto,embed"};
export function render(root) {

    const fileInp = T.el('<input type="file" accept="image/*" class="inp">');
    const out = T.out();
    let lastUrl = '';
    fileInp.addEventListener('change', () => {
      const f = fileInp.files && fileInp.files[0];
      if (!f) return;
      if (!f.type.startsWith('image/')) { T.show(out, '<span class="err">File harus berupa gambar.</span>'); return; }
      const rd = new FileReader();
      rd.onload = () => {
        lastUrl = String(rd.result);
        const img = new Image();
        img.onload = () => {
          const kb = f.size / 1024;
          const sizeS = kb < 1024 ? kb.toFixed(1) + ' KB' : (kb / 1024).toFixed(2) + ' MB';
          T.show(out,
            '<div class="kv"><span class="k">Nama</span><span class="v">' + T.esc(f.name) + '</span></div>' +
            '<div class="kv"><span class="k">Ukuran file</span><span class="v">' + sizeS + '</span></div>' +
            '<div class="kv"><span class="k">Dimensi</span><span class="v">' + img.naturalWidth + ' × ' + img.naturalHeight + ' px</span></div>' +
            '<div class="kv"><span class="k">Tipe</span><span class="v">' + T.esc(f.type) + '</span></div>' +
            '<div class="kv"><span class="k">Panjang string</span><span class="v">' + T.fmt(lastUrl.length) + ' karakter</span></div>' +
            (f.size > 2 * 1024 * 1024 ? '<div class="hint" style="color:#eab308">⚠️ File besar. String Base64 sangat panjang, mungkin berat disalin.</div>' : '') +
            '<div class="center" style="margin:10px 0"><img src="' + T.esc(lastUrl) + '" alt="preview" style="max-width:100%;max-height:220px;border-radius:10px;border:1px solid #3f3f46"></div>');
          out.appendChild(T.row(
            T.btn('Salin Base64', () => T.copy(lastUrl), true),
            T.dlBtn('gambar-base64.txt', () => lastUrl, 'text/plain', 'Unduh .txt')
          ));
          out.appendChild(T.el('<div class="hint" style="margin-top:8px">Siap ditempel: &lt;img src="<span style="font-family:ui-monospace,monospace">data:…</span>"&gt;</div>'));
        };
        img.onerror = () => T.show(out, '<span class="err">Gagal membaca gambar.</span>');
        img.src = lastUrl;
      };
      rd.onerror = () => T.show(out, '<span class="err">Gagal membaca file.</span>');
      rd.readAsDataURL(f);
    });
    root.appendChild(T.field('Pilih gambar', fileInp, 'Semua diproses lokal, gambar tidak di-upload ke mana pun.'));
    root.appendChild(out);
  
}
