import { h as T, fileInput, loadImage } from '../../core.js';

export const meta = {"id": "generator-gta-wasted", "name": "Generator GTA Wasted", "cat": "fun", "icon": "💀", "desc": "Tempel layar Wasted atau Busted ala GTA ke fotomu: foto jadi abu-abu, band gelap, tulisan merah besar.", "keywords": "gta,wasted,busted,foto,prank,meme,game,png", "since": "6.19.0"};

export const MODE_WASTED = ['WASTED', 'BUSTED'];

/* Layout murni dari ukuran kanvas: ukuran huruf dan posisi band. */
export function hitungLayout(w, h) {
  const font = Math.round(w * 0.16);
  const bandH = Math.round(h * 0.24);
  const bandY = Math.round(h * 0.38);
  return { font, bandH, bandY, textY: bandY + Math.round(bandH / 2) + Math.round(font * 0.36) };
}

export function render(root) {
  const box = T.out();
  const modeI = T.select([['WASTED', 'WASTED (kalah / mati)'], ['BUSTED', 'BUSTED (ketangkap polisi)']], 'WASTED');
  const gelapI = T.input('number', '0-100', '55');
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
      x.fillText('Pilih foto dulu, layar WASTED akan muncul di sini', 480, 270);
      return;
    }
    const cw = canvas.width, ch = canvas.height;
    /* isi kanvas penuh, potong sisi yang berlebih */
    const skala = Math.max(cw / img.width, ch / img.height);
    const dw = img.width * skala, dh = img.height * skala;
    const dx = (cw - dw) / 2, dy = (ch - dh) / 2;
    x.filter = 'grayscale(1) contrast(1.05) brightness(0.92)';
    x.drawImage(img, dx, dy, dw, dh);
    x.filter = 'none';
    let gelap = T.num(gelapI.value);
    if (!Number.isFinite(gelap)) gelap = 55;
    gelap = Math.max(0, Math.min(100, gelap));
    const L = hitungLayout(cw, ch);
    x.fillStyle = 'rgba(0,0,0,' + (gelap / 100) + ')';
    x.fillRect(0, L.bandY, cw, L.bandH);
    x.fillStyle = '#c0392b';
    x.strokeStyle = '#000';
    x.lineWidth = Math.round(L.font * 0.08);
    x.font = '700 ' + L.font + 'px Georgia, "Times New Roman", serif';
    x.textAlign = 'center'; x.textBaseline = 'middle';
    x.strokeText(modeI.value, cw / 2, L.textY);
    x.fillText(modeI.value, cw / 2, L.textY);
  };

  const unduh = () => {
    if (!img) { T.toast('Pilih foto dulu'); return; }
    canvas.toBlob((b) => { if (b) T.dl('gta-' + modeI.value.toLowerCase() + '.png', b, 'image/png'); else T.toast('Gagal membuat PNG.'); }, 'image/png');
  };

  fi.onchange = () => {
    const f = fi.files && fi.files[0];
    fi.value = '';
    if (!f) return;
    loadImage(f).then((im) => {
      img = im;
      /* kanvas ikut rasio foto, lebar maks 1280 */
      const rasio = im.width / im.height;
      canvas.width = Math.min(1280, im.width);
      canvas.height = Math.round(canvas.width / rasio);
      gambar();
    }).catch(() => T.toast('Gambar gagal dibaca, coba file lain'));
  };

  [modeI, gelapI].forEach((el) => {
    el.addEventListener('input', gambar);
    el.addEventListener('change', gambar);
  });

  root.appendChild(T.el('<p class="hint">Pilih foto, lalu layar WASTED ala GTA langsung ditempel: foto jadi abu-abu, ada band gelap, tulisan merah besar di tengah. Foto diproses di HP ini saja.</p>'));
  root.appendChild(T.field('Mode', modeI));
  root.appendChild(T.field('Kegelapan band (0-100)', gelapI, 'Semakin besar, band hitam di belakang tulisan semakin pekat.'));
  root.appendChild(T.row(T.btn('🖼️ Pilih foto', () => fi.click(), true), T.btn('⬇️ Unduh PNG', unduh)));
  root.appendChild(box);
  box.appendChild(canvas);
  gambar();
}
