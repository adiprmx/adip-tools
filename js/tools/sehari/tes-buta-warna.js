import { h as T } from '../../core.js?v=6.9.5';

export const meta = {"id": "tes-buta-warna", "name": "Tes Buta Warna", "cat": "sehari", "icon": "👁️", "desc": "Tes Ishihara sederhana lewat gambar.", "keywords": "buta warna,ishihara,mata,tes", "file": "tools/sehari/tes-buta-warna.js"};

const PLATS = ['12', '8', '6', '29', '57', '74'];
const BG_PAL = ['#9aa5a1', '#8b9a93', '#a8b0a6', '#97a3a8', '#b0a89e', '#8f9788', '#a3a8b0'];
const FG_PAL = ['#d97b3f', '#c9632c', '#e08a4a', '#b85a28', '#cf7038'];

function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function drawPlate(canvas, digit, seed) {
  const S = 320, R = 148, CX = S / 2, CY = S / 2;
  canvas.width = S; canvas.height = S;
  const ctx = canvas.getContext('2d');
  const rnd = mulberry32(seed);

  // masker angka di kanvas offscreen
  const M = 160;
  const mc = document.createElement('canvas');
  mc.width = M; mc.height = M;
  const mctx = mc.getContext('2d');
  mctx.fillStyle = '#000';
  mctx.font = '900 ' + (digit.length > 1 ? 96 : 110) + 'px Arial, sans-serif';
  mctx.textAlign = 'center'; mctx.textBaseline = 'middle';
  mctx.fillText(digit, M / 2, M / 2 + 4);
  const mask = mctx.getImageData(0, 0, M, M).data;

  ctx.fillStyle = '#f7f7f5';
  ctx.fillRect(0, 0, S, S);

  let placed = 0, guard = 0;
  while (placed < 1500 && guard++ < 20000) {
    const a = rnd() * Math.PI * 2;
    const rr = Math.sqrt(rnd()) * (R - 4);
    const x = CX + Math.cos(a) * rr;
    const y = CY + Math.sin(a) * rr;
    const mx = Math.floor(x / S * M), my = Math.floor(y / S * M);
    const onDigit = mask[(my * M + mx) * 4 + 3] > 100;
    const pal = onDigit ? FG_PAL : BG_PAL;
    ctx.fillStyle = pal[Math.floor(rnd() * pal.length)];
    ctx.beginPath();
    ctx.arc(x, y, 2.6 + rnd() * 3.4, 0, Math.PI * 2);
    ctx.fill();
    placed++;
  }
  ctx.strokeStyle = '#d4d4d4';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(CX, CY, R, 0, Math.PI * 2);
  ctx.stroke();
}

export function render(root) {
  let idx = 0;
  let seeds = PLATS.map(() => Math.floor(Math.random() * 1e9));
  const jawaban = [];

  const prog = T.el('<div></div>');
  const stage = T.el('<div></div>');
  const box = T.out();

  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'display:block;width:100%;max-width:320px;height:auto;margin:0 auto;border-radius:12px';
  const jawab = T.input('text', 'Ketik angka yang terlihat…');
  jawab.inputMode = 'numeric';

  const interpretasi = (skor) => {
    if (skor === 6) return '<div class="big ok">Kemungkinan penglihatan warna normal 🎉</div><p class="mut" style="font-size:13px">Semua plat terbaca dengan benar.</p>';
    if (skor >= 4) return '<div class="big">Sebagian besar benar (' + skor + '/6)</div><p class="mut" style="font-size:13px">Bisa jadi variasi normal, atau layar HP yang kurang akurat. Kalau ragu, cek ke optik.</p>';
    return '<div class="big warn">Ada indikasi kesulitan membedakan warna (' + skor + '/6)</div><p class="mut" style="font-size:13px">Pertimbangkan pemeriksaan ke dokter mata / optik untuk kepastian.</p>';
  };

  const lanjut = () => {
    const v = jawab.value.trim().replace(/\s+/g, '');
    jawaban.push(v);
    idx++;
    if (idx >= PLATS.length) selesai();
    else tampilPlat();
  };
  const skip = () => { jawaban.push(''); idx++; if (idx >= PLATS.length) selesai(); else tampilPlat(); };

  const btnLanjut = T.btn('Lanjut →', lanjut, true);
  const btnSkip = T.btn('Tidak terlihat', skip);
  const barisTombol = T.row(btnLanjut, btnSkip);
  jawab.addEventListener('keydown', (e) => { if (e.key === 'Enter') lanjut(); });

  const tampilPlat = () => {
    T.show(prog, '<p class="mut center" style="font-size:13px">Plat ' + (idx + 1) + ' dari ' + PLATS.length + '</p>');
    drawPlate(canvas, PLATS[idx], seeds[idx]);
    stage.innerHTML = '';
    stage.appendChild(canvas);
    stage.appendChild(T.field('Angka yang kamu lihat', jawab));
    stage.appendChild(barisTombol);
    jawab.value = '';
  };

  const ulang = () => {
    idx = 0; jawaban.length = 0;
    seeds = PLATS.map(() => Math.floor(Math.random() * 1e9));
    T.hide(box);
    tampilPlat();
  };

  const selesai = () => {
    let skor = 0;
    jawaban.forEach((j, i) => { if (j === PLATS[i]) skor++; });
    let daftar = '<table style="width:100%;font-size:13px;border-collapse:collapse;margin-top:8px">';
    PLATS.forEach((p, i) => {
      const ok = jawaban[i] === p;
      daftar += '<tr><td style="padding:4px 0">Plat ' + (i + 1) + '</td>' +
        '<td style="text-align:center">' + (ok ? '✅' : '❌') + '</td>' +
        '<td style="text-align:right" class="mut">jawaban: ' + T.esc(jawaban[i] || '—') + ' · benar: ' + T.esc(p) + '</td></tr>';
    });
    daftar += '</table>';
    T.show(prog, '<p class="mut center" style="font-size:13px">Selesai!</p>');
    stage.innerHTML = '';
    T.show(box,
      '<div class="big center" style="font-size:30px">Skor: ' + skor + '/' + PLATS.length + '</div>' +
      '<div style="margin-top:8px">' + interpretasi(skor) + '</div>' +
      daftar +
      '<p class="mut" style="font-size:12px;margin-top:10px">⚠️ Ini BUKAN diagnosis medis — hanya skrining seru-seruan. Hasil di layar HP tidak seakurat plat cetak standar. Untuk kepastian, periksa ke dokter mata.</p>');
    box.appendChild(T.row(T.btn('🔄 Ulangi Tes', ulang)));
  };

  root.appendChild(T.el('<p class="mut" style="font-size:13px">Lihat tiap lingkaran titik, lalu ketik angka yang tersembunyi di dalamnya. Ada 6 plat.</p>'));
  root.appendChild(prog);
  root.appendChild(stage);
  root.appendChild(box);
  tampilPlat();
}
