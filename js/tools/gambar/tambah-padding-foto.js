import { h as T, LOCAL_NOTE, canvasToBlob, fileInput, loadImage, utils } from '../../core.js';

// Tambah Padding Foto: perluas kanvas foto dengan ruang kosong di
// sekelilingnya (atas, bawah, kiri, kanan bisa beda-beda). Beda dengan
// bingkai hias: padding di sini untuk menyesuaikan ukuran dan rasio foto
// (misalnya supaya pas 1:1 untuk feed) atau memberi ruang untuk teks.
// Padding bisa berwarna atau transparan (PNG).
export const meta = {"id": "tambah-padding-foto", "name": "Tambah Padding Foto", "cat": "gambar", "icon": "⬜", "desc": "Perluas kanvas foto dengan ruang kosong, atur tiap sisi dan rasionya.", "keywords": "padding,kanvas,perluas,ruang,rasio,margin,foto,feed", "since": "6.19.0"};

// Hitung ukuran kanvas baru. Fungsi murni.
export function hitungUkuranPadding(w, h, pad) {
  const atas = Math.max(0, Math.round(pad.atas || 0));
  const bawah = Math.max(0, Math.round(pad.bawah || 0));
  const kiri = Math.max(0, Math.round(pad.kiri || 0));
  const kanan = Math.max(0, Math.round(pad.kanan || 0));
  return { lebar: w + kiri + kanan, tinggi: h + atas + bawah, atas, bawah, kiri, kanan };
}

// Hitung padding supaya foto pas ke rasio target (mis. 1:1), dengan foto
// tetap di tengah. Mengembalikan padding tiap sisi. Fungsi murni.
export function paddingKeRasio(w, h, rasioLebar, rasioTinggi) {
  const target = rasioLebar / rasioTinggi;
  const kini = w / h;
  if (Math.abs(kini - target) < 0.001) return { atas: 0, bawah: 0, kiri: 0, kanan: 0 };
  if (kini < target) {
    const lebarBaru = Math.round(h * target);
    const total = lebarBaru - w;
    return { atas: 0, bawah: 0, kiri: Math.floor(total / 2), kanan: Math.ceil(total / 2) };
  }
  const tinggiBaru = Math.round(w / target);
  const total = tinggiBaru - h;
  return { atas: Math.floor(total / 2), bawah: Math.ceil(total / 2), kiri: 0, kanan: 0 };
}

const RASIO = [
  ['bebas', 'Bebas (atur sendiri)'],
  ['1:1', 'Persegi 1:1 (feed)'],
  ['4:5', 'Potret 4:5 (feed)'],
  ['3:4', 'Potret 3:4'],
  ['9:16', 'Story 9:16'],
  ['16:9', 'Lanskap 16:9'],
];

export function render(root) {
  const fi = fileInput('image/*');
  const rasioSel = T.select(RASIO, 'bebas');
  const atasIn = T.input('text', '0', '40'); atasIn.inputMode = 'numeric';
  const bawahIn = T.input('text', '0', '40'); bawahIn.inputMode = 'numeric';
  const kiriIn = T.input('text', '0', '40'); kiriIn.inputMode = 'numeric';
  const kananIn = T.input('text', '0', '40'); kananIn.inputMode = 'numeric';
  const warnaIn = T.input('color'); warnaIn.value = '#ffffff';
  const transparanCk = T.input('checkbox');
  transparanCk.style.cssText = 'width:auto;flex:none;margin:0';
  const formatSel = T.select([['png', 'PNG'], ['jpg', 'JPG']], 'png');
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'max-width:100%;height:auto;border-radius:12px;display:block;margin:12px auto;background-image:linear-gradient(45deg,#333 25%,transparent 25%),linear-gradient(-45deg,#333 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#333 75%),linear-gradient(-45deg,transparent 75%,#333 75%);background-size:16px 16px;background-position:0 0,0 8px,8px -8px,-8px 0';
  const infoBox = T.out();
  const statusBox = T.out();
  const hasilBox = T.out();
  let img = null, nama = 'foto';

  function bacaPad() {
    return {
      atas: Math.max(0, utils.parseNum(atasIn.value, 0)),
      bawah: Math.max(0, utils.parseNum(bawahIn.value, 0)),
      kiri: Math.max(0, utils.parseNum(kiriIn.value, 0)),
      kanan: Math.max(0, utils.parseNum(kananIn.value, 0)),
    };
  }

  function gambar() {
    if (!img) return;
    if (rasioSel.value !== 'bebas') {
      const [a, b] = rasioSel.value.split(':').map(Number);
      const p = paddingKeRasio(img.naturalWidth, img.naturalHeight, a, b);
      atasIn.value = String(p.atas); bawahIn.value = String(p.bawah);
      kiriIn.value = String(p.kiri); kananIn.value = String(p.kanan);
    }
    const pad = bacaPad();
    const u = hitungUkuranPadding(img.naturalWidth, img.naturalHeight, pad);
    const skala = Math.min(1, 360 / u.lebar);
    canvas.width = Math.max(1, Math.round(u.lebar * skala));
    canvas.height = Math.max(1, Math.round(u.tinggi * skala));
    const ctx = canvas.getContext('2d');
    if (!transparanCk.checked) { ctx.fillStyle = warnaIn.value || '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height); }
    else ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, pad.kiri * skala, pad.atas * skala, img.naturalWidth * skala, img.naturalHeight * skala);
    T.show(infoBox, `<p class="dim" style="font-size:13px">Ukuran baru: ${u.lebar}×${u.tinggi} px (foto asli ${img.naturalWidth}×${img.naturalHeight}).</p>`);
  }

  [atasIn, bawahIn, kiriIn, kananIn].forEach((el) => el.addEventListener('input', () => { rasioSel.value = 'bebas'; gambar(); }));
  rasioSel.addEventListener('change', gambar);
  warnaIn.addEventListener('input', gambar);
  transparanCk.addEventListener('change', () => {
    if (transparanCk.checked) formatSel.value = 'png';
    gambar();
  });
  formatSel.addEventListener('change', () => { if (formatSel.value === 'jpg') transparanCk.checked = false; gambar(); });

  const dlB = T.btn('Unduh foto (ukuran penuh)', async () => {
    if (!img) { T.toast('Pilih dulu fotonya.'); return; }
    const pad = bacaPad();
    const u = hitungUkuranPadding(img.naturalWidth, img.naturalHeight, pad);
    const c = document.createElement('canvas');
    c.width = u.lebar; c.height = u.tinggi;
    const ctx = c.getContext('2d');
    const transparan = transparanCk.checked;
    if (!transparan) { ctx.fillStyle = warnaIn.value || '#ffffff'; ctx.fillRect(0, 0, u.lebar, u.tinggi); }
    ctx.drawImage(img, pad.kiri, pad.atas);
    const fmt = transparan ? 'png' : formatSel.value;
    const blob = await canvasToBlob(c, fmt === 'png' ? 'image/png' : 'image/jpeg', 0.92);
    if (!blob) { T.toast('Gagal membuat file.'); return; }
    T.dl(`${nama}-padding.${fmt}`, blob, fmt === 'png' ? 'image/png' : 'image/jpeg');
  }, true);

  fi.addEventListener('change', async () => {
    const f = fi.files && fi.files[0];
    if (!f) return;
    T.hide(hasilBox); T.hide(infoBox);
    T.show(statusBox, '<span class="dim">Membuka foto…</span>');
    try {
      img = await loadImage(f);
      nama = (f.name || 'foto').replace(/\.[^.]+$/, '').replace(/[^\w\- ]+/g, '').trim() || 'foto';
      T.hide(statusBox);
      gambar();
      T.show(hasilBox, '');
      hasilBox.appendChild(canvas);
      hasilBox.appendChild(dlB);
    } catch (e) {
      T.show(statusBox, '<div class="err">Foto tidak bisa dibuka. Coba file gambar lain (JPG, PNG, atau WebP).</div>');
    }
    fi.value = '';
  });

  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Tambah ruang kosong di sekeliling foto. Foto tidak dipotong dan tidak diubah ukurannya, hanya kanvasnya yang membesar. Cocok untuk menyesuaikan rasio feed atau memberi ruang tulisan.</p>'));
  root.appendChild(T.field('Pilih foto', fi));
  root.appendChild(T.field('Rasio kanvas', rasioSel, 'Pilih rasio untuk mengisi padding otomatis, atau atur sendiri di bawah.'));
  root.appendChild(T.field('Padding atas (px)', atasIn));
  root.appendChild(T.field('Padding bawah (px)', bawahIn));
  root.appendChild(T.field('Padding kiri (px)', kiriIn));
  root.appendChild(T.field('Padding kanan (px)', kananIn));
  root.appendChild(T.field('Warna padding', warnaIn));
  const trRow = T.el('<label style="display:flex;gap:8px;align-items:center;margin:8px 0;font-size:14px"></label>');
  trRow.appendChild(transparanCk);
  trRow.appendChild(T.el('<span>Padding transparan (hasil selalu PNG)</span>'));
  root.appendChild(trRow);
  root.appendChild(T.field('Format hasil', formatSel));
  root.appendChild(statusBox);
  root.appendChild(infoBox);
  root.appendChild(hasilBox);
  root.appendChild(T.el('<p class="dim" style="font-size:12px">' + LOCAL_NOTE + '</p>'));
}
