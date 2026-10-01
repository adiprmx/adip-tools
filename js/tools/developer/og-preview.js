import { h as T, utils, esc } from '../../core.js?v=6.8.0';

export const meta = {"id": "og-preview", "name": "Open Graph Preview", "cat": "developer", "icon": "👁️", "desc": "Preview tampilan link di medsos.", "keywords": "og,preview,link,sosmed,medsos"};
export function render(root) {

    const fT = T.input('text', 'Judul link', 'Judul Artikel yang Menarik');
    const fD = T.ta(2, 'Deskripsi singkat…', 'Deskripsi singkat yang bikin orang penasaran dan pengin klik.');
    const fU = T.input('text', 'https://contoh.com/artikel', 'https://contoh.com');
    const fImg = T.input('text', 'URL gambar (https://…), atau upload di bawah', '');
    const fFile = T.el('<input type="file" accept="image/*" class="inp">');
    const waBox = T.el('<div></div>'), xBox = T.el('<div></div>');
    let imgData = '';
    fFile.addEventListener('change', () => {
      const f = fFile.files && fFile.files[0];
      if (!f) return;
      const rd = new FileReader();
      rd.onload = () => { imgData = String(rd.result); paint(); };
      rd.readAsDataURL(f);
    });
    const cardShell = 'border-radius:12px;overflow:hidden;max-width:420px;margin-bottom:16px;border:1px solid #27272a';
    function paint() {
      const t = fT.value.trim() || '(tanpa judul)', d = fD.value.trim() || '(tanpa deskripsi)',
        u = fU.value.trim().replace(/^https?:\/\//, '') || 'contoh.com',
        img = imgData || fImg.value.trim();
      const imgHtml = img
        ? '<img src="' + esc(img) + '" style="width:100%;height:200px;object-fit:cover;display:block" alt="">'
        : '<div style="width:100%;height:200px;background:linear-gradient(135deg,#3f3f46,#18181b);display:flex;align-items:center;justify-content:center;color:#71717a;font-size:13px">tidak ada gambar</div>';
      waBox.innerHTML =
        '<div class="hint" style="margin-bottom:6px">WhatsApp:</div>' +
        '<div style="' + cardShell + ';background:#0b141a">' +
        imgHtml +
        '<div style="padding:10px 12px;background:#1f2c34"><div style="font-size:13px;color:#fff">' + esc(t) + '</div>' +
        '<div style="font-size:12px;color:#8696a0;margin-top:2px;overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical">' + esc(d) + '</div>' +
        '<div class="hint" style="margin-top:4px;color:#8696a0">' + esc(u) + '</div></div></div>';
      xBox.innerHTML =
        '<div class="hint" style="margin-bottom:6px">Twitter / X:</div>' +
        '<div style="' + cardShell + ';background:#000">' +
        imgHtml +
        '<div style="padding:10px 12px;border-top:1px solid #2f3336"><div class="hint" style="color:#71767b">' + esc(u) + '</div>' +
        '<div style="font-size:14px;color:#e7e9ea;margin-top:2px">' + esc(t) + '</div>' +
        '<div style="font-size:13px;color:#71767b;margin-top:2px;overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical">' + esc(d) + '</div></div></div>';
    }
    [fT, fD, fU, fImg].forEach((i) => i.addEventListener('input', paint));
    root.appendChild(T.field('og:title', fT));
    root.appendChild(T.field('og:description', fD));
    root.appendChild(T.field('URL', fU));
    root.appendChild(T.field('og:image (URL)', fImg));
    root.appendChild(T.field('atau upload gambar lokal', fFile, 'Gambar tidak diupload ke mana-mana, hanya dibaca di HP kamu.'));
    root.appendChild(waBox);
    root.appendChild(xBox);
    paint();
  
}
