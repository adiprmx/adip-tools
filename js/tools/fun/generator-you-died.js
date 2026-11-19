import { h as T, fileInput, loadImage } from '../../core.js';

export const meta = {"id": "generator-you-died", "name": "Generator You Died", "cat": "fun", "icon": "⚰️", "desc": "Tempel layar YOU DIED ala Dark Souls ke fotomu: foto meredup, tulisan merah besar di tengah.", "keywords": "you died,dark souls,foto,prank,meme,game,mati,png", "since": "6.19.0"};

export const TEKS_YOU_DIED = 'YOU DIED';

/* Layout murni dari ukuran kanvas. */
export function hitungLayout(w, h) {
  const font = Math.round(w * 0.11);
  return { font, textY: Math.round(h / 2), subFont: Math.round(w * 0.028), subY: Math.round(h / 2) + Math.round(font * 0.75) };
}

export function render(root) {
  const box = T.out();
  const subI = T.input('text', 'cth: Dibunuh bos pertama (opsional)', '');
  const redupI = T.input('number', '0-100', '60');
  const fi = fileInput('image/*');
  let img = null;
  const canvas = document.createElement('canvas');
  canvas.width = 960; canvas.height = 540;
  canvas.style.cssText = 'width:100%;max-width:960px;height:auto;border-radius:8px;display:block;margin:0 auto';

  const gambar = () => {
    const x = canvas.getContext('2d');
    if (!img) {
      x.fillStyle = '#171923'; x.fillRect(0, 0, 960, 540);
      x.fillStyle = '#a1a1aa'; x.font = '400 28px system-ui, sans-serif'; x.textAlign = 'center';
      x.fillText('Pilih foto dulu, layar YOU DIED akan muncul di sini', 480, 270);
      return;
    }
    const cw = canvas.width, ch = canvas.height;
    const skala = Math.max(cw / img.width, ch / img.height);
    const dw = img.width * skala, dh = img.height * skala;
    x.filter = 'brightness(0.75) saturate(0.6)';
    x.drawImage(img, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
    x.filter = 'none';
    let redup = T.num(redupI.value);
    if (!Number.isFinite(redup)) redup = 60;
    redup = Math.max(0, Math.min(100, redup));
    x.fillStyle = 'rgba(0,0,0,' + (redup / 100) + ')';
    x.fillRect(0, 0, cw, ch);
    const L = hitungLayout(cw, ch);
    x.textAlign = 'center'; x.textBaseline = 'middle';
    x.font = '400 ' + L.font + 'px Georgia, "Times New Roman", serif';
    x.fillStyle = '#a4130c';
    x.shadowColor = '#000'; x.shadowBlur = Math.round(L.font * 0.25);
    /* spasi antar huruf lebar ala Dark Souls */
    x.fillText('Y O U   D I E D', cw / 2, L.textY);
    x.shadowBlur = 0;
    const sub = subI.value.trim().slice(0, 60);
    if (sub) {
      x.font = 'italic 400 ' + L.subFont + 'px Georgia, serif';
      x.fillStyle = '#c9c9c9';
      x.fillText(sub, cw / 2, L.subY);
    }
  };

  const unduh = () => {
    if (!img) { T.toast('Pilih foto dulu'); return; }
    canvas.toBlob((b) => { if (b) T.dl('you-died.png', b, 'image/png'); else T.toast('Gagal membuat PNG.'); }, 'image/png');
  };

  fi.onchange = () => {
    const f = fi.files && fi.files[0];
    fi.value = '';
    if (!f) return;
    loadImage(f).then((im) => {
      img = im;
      const rasio = im.width / im.height;
      canvas.width = Math.min(1280, im.width);
      canvas.height = Math.round(canvas.width / rasio);
      gambar();
    }).catch(() => T.toast('Gambar gagal dibaca, coba file lain'));
  };

  [subI, redupI].forEach((el) => {
    el.addEventListener('input', gambar);
    el.addEventListener('change', gambar);
  });

  root.appendChild(T.el('<p class="hint">Pilih foto momen apesmu, lalu layar YOU DIED ala Dark Souls langsung ditempel: foto meredup, tulisan merah besar di tengah. Boleh tambah satu baris keterangan di bawahnya. Foto diproses di HP ini saja.</p>'));
  root.appendChild(T.field('Keterangan (opsional)', subI, 'Misal: "Dibunuh bos pertama". Kosongkan kalau tidak perlu.'));
  root.appendChild(T.field('Seberapa redup foto (0-100)', redupI, 'Semakin besar, foto semakin gelap di balik tulisan.'));
  root.appendChild(T.row(T.btn('🖼️ Pilih foto', () => fi.click(), true), T.btn('⬇️ Unduh PNG', unduh)));
  root.appendChild(box);
  box.appendChild(canvas);
  gambar();
}
