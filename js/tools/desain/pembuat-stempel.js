import { h as T, kv, canvasToBlob, errBox } from '../../core.js';

export const meta = {"id":"pembuat-stempel","name":"Pembuat Stempel","cat":"desain","icon":"🔖","desc":"Bikin stempel bulat atau kotak untuk toko dan usaha sendiri.","keywords":"stempel,cap,toko,usaha,logo,bulat","since":"6.11.0"};

/* Stempel bulat/kotak digambar ke canvas (PNG transparan 600 px).
   Batasan jujur di UI: hanya untuk stempel usaha/toko sendiri, bukan
   untuk meniru stempel instansi resmi atau memalsukan dokumen. */
const S = 600;
const WARNA = {
  biru: '#1d4ed8',
  merah: '#dc2626',
  hitam: '#18181b',
  hijau: '#15803d',
};

function star(ctx, cx, cy, rOuter, rInner, color) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? rOuter : rInner;
    const a = -Math.PI / 2 + i * Math.PI / 5;
    const x = cx + r * Math.cos(a), y = cy + r * Math.sin(a);
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

function arcText(ctx, text, cx, cy, radius, top, color) {
  const chars = [...text];
  if (!chars.length) return;
  let fs = 46;
  let step = 0;
  for (;;) {
    step = (fs * 0.72) / radius;
    if (step * (chars.length - 1) <= Math.PI * 1.05 || fs <= 16) break;
    fs -= 2;
  }
  const total = step * (chars.length - 1);
  ctx.fillStyle = color;
  ctx.font = '700 ' + fs + 'px "Times New Roman", Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  chars.forEach((ch, i) => {
    let a;
    if (top) a = -Math.PI / 2 - total / 2 + i * step;
    else a = Math.PI / 2 + total / 2 - i * step;
    ctx.save();
    ctx.translate(cx + radius * Math.cos(a), cy + radius * Math.sin(a));
    ctx.rotate(top ? a + Math.PI / 2 : a - Math.PI / 2);
    ctx.fillText(ch, 0, 0);
    ctx.restore();
  });
}

export function render(root) {
  const bentukSel = T.select([['bulat', 'Bulat'], ['kotak', 'Kotak']], 'bulat');
  const atasInp = T.input('text', 'cth: TOKO BERKAH JAYA', 'TOKO BERKAH JAYA');
  const tengahInp = T.input('text', 'cth: Depok', 'DEPOK');
  const bawahInp = T.input('text', 'cth: 021-1234567 atau tahun berdiri', 'EST. 2020');
  const warnaSel = T.select([['biru', 'Biru'], ['merah', 'Merah'], ['hitam', 'Hitam'], ['hijau', 'Hijau']], 'biru');
  const bintangChk = T.el('<input type="checkbox" checked style="width:18px;height:18px;accent-color:#fafafa">');
  const canvas = document.createElement('canvas');
  canvas.width = S; canvas.height = S;
  canvas.style.cssText = 'width:100%;max-width:320px;height:auto;margin:0 auto;display:block;background:repeating-conic-gradient(#3f3f46 0% 25%, #27272a 0% 50%) 0 0/16px 16px;border-radius:10px';
  const box = T.out();
  const prevWrap = T.el('<div style="margin-top:12px"></div>');
  prevWrap.appendChild(canvas);

  const gambar = () => {
    const x = canvas.getContext('2d');
    if (!x) { T.show(box, errBox('Browser ini tidak mendukung canvas.')); return; }
    const color = WARNA[warnaSel.value] || WARNA.biru;
    const cx = S / 2, cy = S / 2;
    x.clearRect(0, 0, S, S);
    x.strokeStyle = color;
    x.fillStyle = color;
    const atas = atasInp.value.trim().toUpperCase();
    const tengah = tengahInp.value.trim().toUpperCase();
    const bawah = bawahInp.value.trim().toUpperCase();
    if (bentukSel.value === 'bulat') {
      x.lineWidth = 10;
      x.beginPath(); x.arc(cx, cy, 282, 0, Math.PI * 2); x.stroke();
      x.lineWidth = 3;
      x.beginPath(); x.arc(cx, cy, 262, 0, Math.PI * 2); x.stroke();
      x.beginPath(); x.arc(cx, cy, 150, 0, Math.PI * 2); x.stroke();
      arcText(x, atas, cx, cy, 222, true, color);
      arcText(x, bawah, cx, cy, 222, false, color);
      const showStar = bintangChk.checked;
      if (showStar) star(x, cx, cy - (tengah ? 34 : 0), 52, 21, color);
      if (tengah) {
        x.font = '700 44px "Times New Roman", Georgia, serif';
        x.textAlign = 'center'; x.textBaseline = 'middle';
        x.fillText(tengah.length > 14 ? tengah.slice(0, 14) : tengah, cx, cy + (showStar ? 62 : 0));
      }
    } else {
      x.lineWidth = 9;
      x.strokeRect(18, 18, S - 36, S - 36);
      x.lineWidth = 2.5;
      x.strokeRect(36, 36, S - 72, S - 72);
      x.font = '700 46px "Times New Roman", Georgia, serif';
      x.textAlign = 'center'; x.textBaseline = 'middle';
      if (atas) x.fillText(atas.length > 18 ? atas.slice(0, 18) : atas, cx, 108);
      x.beginPath(); x.moveTo(70, 168); x.lineTo(S - 70, 168); x.lineWidth = 2; x.stroke();
      const showStar = bintangChk.checked;
      if (showStar) star(x, cx, cy - (tengah ? 30 : 0), 56, 23, color);
      if (tengah) {
        x.font = '700 48px "Times New Roman", Georgia, serif';
        x.fillText(tengah.length > 14 ? tengah.slice(0, 14) : tengah, cx, cy + (showStar ? 72 : 0));
      }
      x.beginPath(); x.moveTo(70, S - 168); x.lineTo(S - 70, S - 168); x.lineWidth = 2; x.stroke();
      if (bawah) {
        x.font = '700 40px "Times New Roman", Georgia, serif';
        x.fillText(bawah.length > 20 ? bawah.slice(0, 20) : bawah, cx, S - 108);
      }
    }
    T.show(box, kv('Ukuran', S + ' × ' + S + ' px, latar transparan'));
    box.appendChild(T.row(T.btn('Unduh PNG', async () => {
      const blob = await canvasToBlob(canvas, 'image/png');
      if (blob) T.dl('stempel.png', blob, 'image/png');
      else T.toast('Gagal membuat PNG');
    }, true)));
  };

  const contohBtn = T.btn('Isi contoh toko', () => {
    atasInp.value = 'TOKO BERKAH JAYA';
    tengahInp.value = 'DEPOK';
    bawahInp.value = 'EST. 2020';
    gambar();
  });

  const chkRow = T.el('<label style="display:flex;gap:10px;align-items:center;font-size:14px;margin:8px 0;cursor:pointer"></label>');
  chkRow.appendChild(bintangChk);
  chkRow.appendChild(T.el('<span>Bintang di tengah</span>'));

  [bentukSel, warnaSel].forEach((el) => el.addEventListener('change', gambar));
  [atasInp, tengahInp, bawahInp].forEach((el) => el.addEventListener('input', gambar));
  bintangChk.addEventListener('change', gambar);

  root.appendChild(T.el('<p class="mut" style="font-size:13.5px;line-height:1.6">Stempel ini untuk keperluan usaha atau toko sendiri, misalnya cap toko di nota dan kemasan. Jangan dipakai untuk meniru stempel instansi resmi, sekolah, atau kantor pemerintah, dan jangan dipakai untuk memalsukan dokumen.</p>'));
  root.appendChild(T.grid2(T.field('Bentuk', bentukSel), T.field('Warna tinta', warnaSel)));
  root.appendChild(T.field('Teks atas', atasInp, 'Untuk stempel bulat, teks ini melingkar di atas.'));
  root.appendChild(T.field('Teks tengah', tengahInp, 'Nama singkat, misalnya kota atau nama usaha.'));
  root.appendChild(T.field('Teks bawah', bawahInp, 'Untuk stempel bulat, teks ini melingkar di bawah.'));
  root.appendChild(chkRow);
  root.appendChild(T.row(contohBtn, T.btn('Perbarui gambar', gambar, true)));
  root.appendChild(prevWrap);
  root.appendChild(box);
  gambar();
}
