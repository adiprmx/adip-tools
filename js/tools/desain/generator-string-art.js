import { h as T, LOCAL_NOTE, fileInput, loadImage, canvasToBlob } from '../../core.js';

export const meta = {"id":"generator-string-art","name":"Generator String Art","cat":"desain","icon":"🧶","desc":"Ubah foto jadi string art: urutan lilitan satu benang di cincin paku.","keywords":"string art,benang,paku,potret,template,cetak","since":"6.19.0"};

// Posisi paku di sekeliling lingkaran (fungsi murni, bisa diuji tanpa DOM).
export function lingkaranPin(n, cx, cy, r) {
  const pin = [];
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + i * 2 * Math.PI / n;
    pin.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
  }
  return pin;
}

// Titik-titik di sepanjang garis (Bresenham sederhana, fungsi murni).
export function titikGaris(x0, y0, x1, y1) {
  const pts = [];
  const dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let err = dx - dy, x = x0, y = y0;
  let guard = 0;
  while (guard++ < 10000) {
    pts.push([x, y]);
    if (x === x1 && y === y1) break;
    const e2 = 2 * err;
    if (e2 > -dy) { err -= dy; x += sx; }
    if (e2 < dx) { err += dx; y += sy; }
  }
  return pts;
}

// Skor garis: jumlah kegelapan piksel yang dilewati (fungsi murni).
export function skorGaris(gelap, w, h, x0, y0, x1, y1) {
  const pts = titikGaris(x0, y0, x1, y1);
  let skor = 0;
  pts.forEach(([x, y]) => {
    if (x >= 0 && x < w && y >= 0 && y < h) skor += gelap[y * w + x];
  });
  return skor / Math.max(1, pts.length);
}

export function render(root) {
  root.appendChild(T.el('<p class="note">🔒 ' + LOCAL_NOTE + '</p>'));
  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Pilih foto wajah atau objek dengan latar sederhana. Alat ini menghitung urutan lilitan satu benang mengelilingi cincin paku, memakai algoritma greedy: tiap lilitan dipilih yang paling banyak menutupi bagian gelap foto. Prosesnya bertahap supaya HP tidak macet.</p>'));

  const fileI = fileInput('image/*');
  const pinSel = T.select([['120', '120 paku'], ['180', '180 paku'], ['240', '240 paku']], '180');
  const garisSel = T.select([['1000', '1.000 lilitan'], ['2000', '2.000 lilitan'], ['3000', '3.000 lilitan']], '2000');
  root.appendChild(T.field('Pilih foto', fileI));
  root.appendChild(T.grid2(T.field('Jumlah paku', pinSel), T.field('Jumlah lilitan', garisSel)));

  const statusBox = T.el('<div class="dim" style="font-size:12.5px;margin:8px 0;min-height:18px" role="status" aria-live="polite"></div>');
  const progBar = T.el('<div style="height:8px;border-radius:4px;background:var(--surface-2);overflow:hidden;margin:8px 0;display:none"><div style="height:100%;width:0%;background:var(--acc)"></div></div>');
  const progIsi = progBar.firstChild;
  const canvas = document.createElement('canvas');
  canvas.width = 500; canvas.height = 500;
  canvas.style.cssText = 'width:100%;max-width:500px;height:auto;border-radius:12px;display:block;margin:12px auto;background:#f6f1e8;border:1px solid var(--line)';
  const box = T.out();
  const infoBox = T.out();

  let imgTerakhir = null, urutan = [], pinAktif = [], sedangJalan = false, alive = true;
  T.onLeave(() => { alive = false; });

  function siapkanGelap(img, ukuran) {
    const c = document.createElement('canvas');
    c.width = ukuran; c.height = ukuran;
    const ctx = c.getContext('2d');
    if (!ctx) return null;
    const s = Math.min(img.naturalWidth, img.naturalHeight);
    ctx.drawImage(img, (img.naturalWidth - s) / 2, (img.naturalHeight - s) / 2, s, s, 0, 0, ukuran, ukuran);
    const d = ctx.getImageData(0, 0, ukuran, ukuran);
    const gelap = new Float32Array(ukuran * ukuran);
    const cx = ukuran / 2, cy = ukuran / 2, r = ukuran / 2;
    for (let y = 0; y < ukuran; y++) {
      for (let x = 0; x < ukuran; x++) {
        const i = y * ukuran + x;
        const dx = x - cx, dy = y - cy;
        if (dx * dx + dy * dy > r * r) { gelap[i] = 0; continue; }
        const lum = 0.299 * d.data[i * 4] + 0.587 * d.data[i * 4 + 1] + 0.114 * d.data[i * 4 + 2];
        gelap[i] = Math.max(0, 1 - lum / 255);
      }
    }
    return gelap;
  }

  function gambarBenang(ctx, urutanBaru, dari) {
    ctx.strokeStyle = 'rgba(20,16,12,0.55)';
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    for (let i = Math.max(1, dari); i < urutanBaru.length; i++) {
      const a = pinAktif[urutanBaru[i - 1]], b = pinAktif[urutanBaru[i]];
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
    }
    ctx.stroke();
  }

  function gambarPaku(ctx) {
    ctx.fillStyle = '#161311';
    pinAktif.forEach((p) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 1.6, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  async function jalan() {
    if (!imgTerakhir) { T.toast('Pilih foto dulu'); return; }
    if (sedangJalan) return;
    sedangJalan = true;
    jalanBtn.disabled = true;
    const nPin = parseInt(pinSel.value, 10);
    const target = parseInt(garisSel.value, 10);
    const UK = 120;
    const gelap = siapkanGelap(imgTerakhir, UK);
    if (!gelap) { T.toast('Foto tidak bisa diproses di perangkat ini'); sedangJalan = false; jalanBtn.disabled = false; return; }
    pinAktif = lingkaranPin(nPin, 250, 250, 240);
    const pinKecil = lingkaranPin(nPin, UK / 2, UK / 2, UK / 2 - 1);
    const ctx = canvas.getContext('2d');
    if (!ctx) { T.toast('Gambar tidak bisa dibuat di perangkat ini'); sedangJalan = false; jalanBtn.disabled = false; return; }
    ctx.fillStyle = '#f6f1e8';
    ctx.fillRect(0, 0, 500, 500);
    gambarPaku(ctx);
    urutan = [0];
    let saatIni = 0;
    progBar.style.display = 'block';
    const kerja = 40;
    const batch = () => {
      if (!alive) { sedangJalan = false; return; }
      const akhir = Math.min(target, urutan.length + kerja);
      for (let k = urutan.length; k < akhir; k++) {
        let terbaik = -1, skorTerbaik = -1;
        const kandidat = 60;
        for (let c = 0; c < kandidat; c++) {
          const t = Math.floor(Math.random() * nPin);
          if (t === saatIni) continue;
          const a = pinKecil[saatIni], b = pinKecil[t];
          const s = skorGaris(gelap, UK, UK, Math.round(a.x), Math.round(a.y), Math.round(b.x), Math.round(b.y));
          if (s > skorTerbaik) { skorTerbaik = s; terbaik = t; }
        }
        if (terbaik === -1) break;
        const a = pinKecil[saatIni], b = pinKecil[terbaik];
        titikGaris(Math.round(a.x), Math.round(a.y), Math.round(b.x), Math.round(b.y)).forEach(([x, y]) => {
          if (x >= 0 && x < UK && y >= 0 && y < UK) {
            const i = y * UK + x;
            gelap[i] = Math.max(0, gelap[i] - 0.12);
          }
        });
        urutan.push(terbaik);
        saatIni = terbaik;
      }
      gambarBenang(ctx, urutan, Math.max(1, urutan.length - kerja - 1));
      gambarPaku(ctx);
      const persen = Math.round(urutan.length / target * 100);
      progIsi.style.width = persen + '%';
      statusBox.textContent = 'Menghitung lilitan ' + urutan.length + ' dari ' + target + ' (' + persen + '%).';
      if (urutan.length < target) {
        setTimeout(batch, 0);
      } else {
        sedangJalan = false;
        jalanBtn.disabled = false;
        progBar.style.display = 'none';
        statusBox.textContent = 'Selesai: ' + urutan.length + ' lilitan dengan ' + nPin + ' paku.';
        T.hide(box);
        T.show(infoBox, '<div style="font-size:13.5px;line-height:1.6">Urutan lilitan (nomor paku): ' + T.esc(urutan.slice(0, 40).join(', ')) + (urutan.length > 40 ? ', ...' : '') + '. Unduh daftar lengkapnya di bawah.</div>');
      }
    };
    setTimeout(batch, 0);
  }

  const jalanBtn = T.btn('Buat String Art', jalan, true);
  const dlPng = T.btn('Unduh PNG', async () => {
    if (!urutan.length) { T.toast('Buat string art dulu'); return; }
    try {
      const blob = await canvasToBlob(canvas, 'image/png');
      if (!blob) { T.toast('Gambarnya tidak bisa dibuat. Coba lagi.'); return; }
      T.dl('string-art.png', blob, 'image/png');
      T.toast('Berhasil diunduh');
    } catch (e) { T.toast('Gambarnya tidak bisa diunduh. Coba lagi.'); }
  });
  const dlUrutan = T.btn('Unduh Urutan Paku', () => {
    if (!urutan.length) { T.toast('Buat string art dulu'); return; }
    let teks = 'String Art: ' + pinAktif.length + ' paku, ' + urutan.length + ' lilitan\n';
    teks += 'Urutan paku (mulai dari paku 0 di atas, searah jarum jam):\n';
    teks += urutan.join(', ') + '\n';
    T.dl('urutan-string-art.txt', teks, 'text/plain');
    T.toast('Berhasil diunduh');
  });
  const dlTemplate = T.btn('Unduh Template Paku (SVG)', () => {
    const n = pinAktif.length || parseInt(pinSel.value, 10);
    const pin = lingkaranPin(n, 300, 300, 280);
    let svg = '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600"><rect width="600" height="600" fill="#ffffff"/><circle cx="300" cy="300" r="280" fill="none" stroke="#161311" stroke-width="1"/>';
    pin.forEach((p, i) => {
      svg += '<circle cx="' + Math.round(p.x * 10) / 10 + '" cy="' + Math.round(p.y * 10) / 10 + '" r="3" fill="#161311"/>';
      if (i % 10 === 0) svg += '<text x="' + Math.round(p.x * 10) / 10 + '" y="' + Math.round(p.y * 10) / 10 + '" font-size="11" fill="#ff6f61" text-anchor="middle" dy="-6">' + i + '</text>';
    });
    svg += '</svg>';
    T.dl('template-paku-string-art.svg', svg, 'image/svg+xml');
    T.toast('Berhasil diunduh');
  });

  fileI.addEventListener('change', async () => {
    if (!fileI.files[0]) return;
    try {
      imgTerakhir = await loadImage(fileI.files[0]);
      statusBox.textContent = 'Foto dimuat. Tekan tombol Buat String Art.';
    } catch (e) { T.toast('File itu bukan gambar. Pilih file gambar.'); }
  });

  root.appendChild(T.el('<div style="height:8px"></div>'));
  root.appendChild(T.row(jalanBtn));
  root.appendChild(statusBox);
  root.appendChild(progBar);
  root.appendChild(canvas);
  root.appendChild(T.row(dlPng, dlUrutan, dlTemplate));
  root.appendChild(infoBox);
  root.appendChild(box);
  T.show(box, '<div class="dim center" style="padding:14px 0">Hasil string art akan tampil di atas setelah dihitung.</div>');
}
