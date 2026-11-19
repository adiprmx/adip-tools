import { h as T, utils, loadImage, fileInput, canvasToBlob, LOCAL_NOTE } from '../../core.js';

// Filter 10 Year Challenge: foto jadi seperti hasil kamera HP dan filter
// Instagram 10 tahun lalu. Hitamnya terangkat (pudar), warnanya hangat,
// ada grain halus dan gelap tipis di pinggir, plus bingkai putih dengan
// tulisan tahunnya. Tahun di bingkai dihitung dari tahun ini dikurangi 10.
// Pratinjau dihitung di canvas kecil; hasil unduhan dihitung ulang di
// resolusi asli.
export const meta = {"id": "filter-10-year-challenge", "name": "Filter 10 Year Challenge", "cat": "gambar", "icon": "🕰️", "desc": "Ubah foto jadi tampilan 10 tahun lalu: filter lama, kamera HP jadul, bingkai.", "keywords": "10 year challenge,10 tahun lalu,filter lama,instagram lama,jadul,foto", "since": "6.19.0"};

// PRNG kecil yang bisa diulang (mulberry32) supaya grain deterministis.
// Memakai utils.mulberry32; biji null/undefined tetap jadi 1 seperti
// sebelum migrasi (kanon memakai 0; kanonis, G4 C1G4-R).
export function buatAcak(biji) { return utils.mulberry32(biji == null ? 1 : biji); }

// Filter 10 Year Challenge pada data piksel RGBA. Kembalikan array baru.
// pudar 0..100 (hitam terangkat), hangat 0..100 (rona kuning),
// biji angka untuk grain (sama = pola grain sama).
export function filter10Year(data, w, h, opsi) {
  const o = opsi || {};
  const pudar = Math.max(0, Math.min(100, o.pudar == null ? 55 : o.pudar)) / 100;
  const hangat = Math.max(0, Math.min(100, o.hangat == null ? 60 : o.hangat)) / 100;
  const acak = buatAcak(o.biji == null ? 2016 : o.biji);
  const angkat = 26 * pudar;
  const keluar = new Uint8ClampedArray(data.length);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const j = (y * w + x) * 4;
      const cx = (x + 0.5) / w - 0.5;
      const cy = (y + 0.5) / h - 0.5;
      const d = Math.sqrt(cx * cx + cy * cy) * 2;
      const vig = 1 - 0.18 * Math.max(0, Math.min(1, (d - 0.6) / 0.4));
      const grain = (acak() - 0.5) * 14;
      const r0 = data[j] * (1 - angkat / 255) + angkat;
      const g0 = data[j + 1] * (1 - angkat / 255) + angkat;
      const b0 = data[j + 2] * (1 - angkat / 255) + angkat;
      keluar[j] = (r0 * (1 + 0.07 * hangat) + grain) * vig;
      keluar[j + 1] = (g0 * (1 + 0.01 * hangat) + grain) * vig;
      keluar[j + 2] = (b0 * (1 - 0.09 * hangat) + grain) * vig;
      keluar[j + 3] = data[j + 3];
    }
  }
  return keluar;
}

// Tahun yang ditulis di bingkai: tahun ini dikurangi 10.
export function tahunChallenge(tahunIni) {
  return (tahunIni == null ? new Date().getFullYear() : tahunIni) - 10;
}

export function render(root) {
  const fi = fileInput('image/*');
  const bingkaiSel = T.select([['ya', 'Ya, pakai bingkai'], ['tidak', 'Tidak, fotonya saja']], 'ya');
  const fmtSel = T.select([['png', 'PNG (tanpa pecah)'], ['jpeg', 'JPG (ukuran kecil)']], 'png');
  const statusBox = T.out();
  const box = T.out();

  const pudarR = T.input('range');
  pudarR.min = '0'; pudarR.max = '100'; pudarR.value = '55';
  const pudarV = T.el('<b>55%</b>');
  const pudarWrap = T.el('<div class="row" style="align-items:center"></div>');
  pudarWrap.appendChild(pudarR); pudarWrap.appendChild(pudarV);

  const hangatR = T.input('range');
  hangatR.min = '0'; hangatR.max = '100'; hangatR.value = '60';
  const hangatV = T.el('<b>60%</b>');
  const hangatWrap = T.el('<div class="row" style="align-items:center"></div>');
  hangatWrap.appendChild(hangatR); hangatWrap.appendChild(hangatV);

  let img = null;
  let nw = 0, nh = 0;
  let namaFile = 'foto';
  let pratinjau = null;
  let pratinjauCtx = null;
  let dataAsli = null;
  let tampilAsli = false;
  let raf = 0;

  function opsiAktif() {
    return { pudar: parseInt(pudarR.value, 10), hangat: parseInt(hangatR.value, 10), biji: 2016 };
  }

  function gambarBingkai(ctx, w, h) {
    const tepi = Math.max(10, Math.round(w * 0.045));
    const bawah = Math.max(28, Math.round(h * 0.11));
    ctx.fillStyle = '#f5f2ec';
    ctx.fillRect(0, 0, w, tepi);
    ctx.fillRect(0, h - bawah, w, bawah);
    ctx.fillRect(0, 0, tepi, h);
    ctx.fillRect(w - tepi, 0, tepi, h);
    ctx.fillStyle = '#3a352d';
    ctx.font = '700 ' + Math.max(13, Math.round(bawah * 0.42)) + 'px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('10 YEAR CHALLENGE  •  ' + tahunChallenge(), w / 2, h - bawah / 2 + 1);
  }

  function gambarPratinjau() {
    if (!pratinjau || !dataAsli) return;
    if (tampilAsli) {
      pratinjauCtx.putImageData(dataAsli, 0, 0);
      return;
    }
    const hasil = filter10Year(dataAsli.data, dataAsli.width, dataAsli.height, opsiAktif());
    pratinjauCtx.putImageData(new ImageData(new Uint8ClampedArray(hasil), dataAsli.width, dataAsli.height), 0, 0);
    if (bingkaiSel.value === 'ya') gambarBingkai(pratinjauCtx, dataAsli.width, dataAsli.height);
  }
  function jadwalPratinjau() {
    if (raf) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(gambarPratinjau);
  }
  function kembaliKeHasil() {
    if (tampilAsli) { tampilAsli = false; lihatB.textContent = 'Lihat foto asli'; }
  }
  pudarR.addEventListener('input', () => { pudarV.textContent = pudarR.value + '%'; kembaliKeHasil(); jadwalPratinjau(); });
  hangatR.addEventListener('input', () => { hangatV.textContent = hangatR.value + '%'; kembaliKeHasil(); jadwalPratinjau(); });
  bingkaiSel.addEventListener('change', () => { kembaliKeHasil(); jadwalPratinjau(); });

  fi.addEventListener('change', async () => {
    const f = fi.files && fi.files[0];
    if (!f) return;
    T.hide(box); T.hide(statusBox);
    T.show(statusBox, '<span class="dim">Membuka foto…</span>');
    try {
      img = await loadImage(f);
      nw = img.naturalWidth; nh = img.naturalHeight;
      namaFile = (f.name || 'foto').replace(/\.[^.]*$/, '');
      const skala = Math.min(1, 800 / Math.max(nw, nh));
      const w = Math.max(1, Math.round(nw * skala));
      const h = Math.max(1, Math.round(nh * skala));
      pratinjau = document.createElement('canvas');
      pratinjau.width = w; pratinjau.height = h;
      pratinjau.style.cssText = 'max-width:100%;height:auto;border-radius:10px;display:block';
      pratinjauCtx = pratinjau.getContext('2d', { willReadFrequently: true });
      pratinjauCtx.drawImage(img, 0, 0, w, h);
      dataAsli = pratinjauCtx.getImageData(0, 0, w, h);
      tampilAsli = false;
      lihatB.textContent = 'Lihat foto asli';
      T.hide(statusBox);
      T.show(box, '');
      box.appendChild(pratinjau);
      unduhB.disabled = false;
      lihatB.disabled = false;
      gambarPratinjau();
    } catch (e) {
      img = null;
      T.show(statusBox, '<div class="err">Foto tidak bisa dibuka. Pastikan filenya gambar yang benar (JPG/PNG/WebP).</div>');
      unduhB.disabled = true;
      lihatB.disabled = true;
    }
  });

  async function unduh() {
    if (!img) { T.toast('Pilih foto dulu'); return; }
    unduhB.disabled = true;
    T.show(statusBox, '<span class="dim">Menyiapkan hasil…</span>');
    try {
      const c = document.createElement('canvas');
      c.width = nw; c.height = nh;
      const ctx = c.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(img, 0, 0, nw, nh);
      const data = ctx.getImageData(0, 0, nw, nh);
      const hasil = filter10Year(data.data, nw, nh, opsiAktif());
      ctx.putImageData(new ImageData(new Uint8ClampedArray(hasil), nw, nh), 0, 0);
      if (bingkaiSel.value === 'ya') gambarBingkai(ctx, nw, nh);
      const mime = fmtSel.value === 'png' ? 'image/png' : 'image/jpeg';
      const blob = await canvasToBlob(c, mime, 0.92);
      if (!blob) throw new Error('gagal');
      T.dl(namaFile + '-10-year-challenge.' + (fmtSel.value === 'png' ? 'png' : 'jpg'), blob, mime);
      T.toast('Berhasil diunduh');
    } catch (e) {
      T.toast('Gagal membuat hasil, coba lagi');
    } finally {
      T.hide(statusBox);
      unduhB.disabled = false;
    }
  }

  const lihatB = T.btn('Lihat foto asli', () => {
    if (!img) return;
    tampilAsli = !tampilAsli;
    lihatB.textContent = tampilAsli ? 'Lihat hasil' : 'Lihat foto asli';
    gambarPratinjau();
  }, false, true);
  const unduhB = T.btn('Unduh Hasil', unduh, true, true);

  root.appendChild(T.el('<p class="note">🔒 ' + LOCAL_NOTE + '</p>'));
  root.appendChild(T.field('Pilih foto', fi));
  root.appendChild(T.field('Seberapa pudar warnanya', pudarWrap, 'Hitamnya terangkat seperti foto lama. Di ujung kiri, warnanya tetap pekat.'));
  root.appendChild(T.field('Seberapa hangat warnanya', hangatWrap, 'Rona kuning khas foto tahun 2010-an.'));
  root.appendChild(T.field('Bingkai putih + tulisan tahun', bingkaiSel));
  root.appendChild(T.field('Format hasil', fmtSel));
  root.appendChild(statusBox);
  T.show(box, '<span class="dim">Pilih foto dulu, hasilnya muncul di sini.</span>');
  root.appendChild(box);
  root.appendChild(T.row(lihatB, unduhB));
}
