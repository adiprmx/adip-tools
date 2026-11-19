import { h as T, fileInput, loadImage } from '../../core.js';

export const meta = {"id": "generator-mission-passed", "name": "Generator Mission Passed", "cat": "fun", "icon": "🏆", "desc": "Buat layar Mission Passed, Respect+, atau Mission Failed ala GTA di fotomu, lengkap dengan nominal hadiahnya.", "keywords": "gta,mission passed,respect,mission failed,foto,prank,meme,game,png", "since": "6.19.0"};

export const MODE_MISSION = ['passed', 'failed'];

export function formatRespect(n) {
  if (!Number.isFinite(n)) return '+$0';
  return '+$' + T.fmt(Math.max(0, Math.round(n)));
}

/* Layout murni dari ukuran kanvas. */
export function hitungLayout(w, h) {
  return {
    judulFont: Math.round(w * 0.075),
    subFont: Math.round(w * 0.032),
    judulY: Math.round(h * 0.42),
    subY: Math.round(h * 0.52),
    respectY: Math.round(h * 0.62),
  };
}

export function render(root) {
  const box = T.out();
  const modeI = T.select([['passed', 'Mission Passed! (+ Respect)'], ['failed', 'Mission Failed']], 'passed');
  const misiI = T.input('text', 'cth: Ujian Akhir Semester', 'Ujian Akhir Semester');
  const respectI = T.input('number', 'cth: 250', '250');
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
      x.fillText('Pilih foto dulu, layar misi akan muncul di sini', 480, 270);
      return;
    }
    const cw = canvas.width, ch = canvas.height;
    const skala = Math.max(cw / img.width, ch / img.height);
    const dw = img.width * skala, dh = img.height * skala;
    x.drawImage(img, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
    x.fillStyle = 'rgba(0,0,0,0.45)';
    x.fillRect(0, 0, cw, ch);
    const L = hitungLayout(cw, ch);
    const passed = modeI.value === 'passed';
    x.textAlign = 'center'; x.textBaseline = 'middle';
    x.font = '700 ' + L.judulFont + 'px Georgia, "Times New Roman", serif';
    x.fillStyle = passed ? '#ffd54a' : '#e53935';
    x.strokeStyle = '#000'; x.lineWidth = Math.round(L.judulFont * 0.06);
    const judul = passed ? 'MISSION PASSED!' : 'MISSION FAILED';
    x.strokeText(judul, cw / 2, L.judulY);
    x.fillText(judul, cw / 2, L.judulY);
    x.font = '400 ' + L.subFont + 'px Georgia, serif';
    x.fillStyle = '#fff';
    const misi = (misiI.value.trim() || 'Misi').slice(0, 50);
    x.fillText(misi, cw / 2, L.subY);
    if (passed) {
      x.font = '700 ' + L.subFont + 'px Georgia, serif';
      x.fillStyle = '#7ee787';
      x.fillText('Respect ' + formatRespect(T.num(respectI.value)), cw / 2, L.respectY);
    }
  };

  const unduh = () => {
    if (!img) { T.toast('Pilih foto dulu'); return; }
    canvas.toBlob((b) => { if (b) T.dl('gta-mission-' + modeI.value + '.png', b, 'image/png'); else T.toast('Gagal membuat PNG.'); }, 'image/png');
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

  [modeI, misiI, respectI].forEach((el) => {
    el.addEventListener('input', gambar);
    el.addEventListener('change', gambar);
  });

  root.appendChild(T.el('<p class="hint">Pilih foto, tulis nama misinya, lalu atur nominal Respect. Mode Failed tanpa nominal, cocok buat momen gagal yang mau dikenang dengan santai. Foto diproses di HP ini saja.</p>'));
  root.appendChild(T.field('Mode', modeI));
  root.appendChild(T.field('Nama misi', misiI));
  root.appendChild(T.field('Respect (angka saja)', respectI, 'Hanya dipakai di mode Mission Passed.'));
  root.appendChild(T.row(T.btn('🖼️ Pilih foto', () => fi.click(), true), T.btn('⬇️ Unduh PNG', unduh)));
  root.appendChild(box);
  box.appendChild(canvas);
  gambar();
}
