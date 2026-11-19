import { h as T, onLeave } from '../../core.js';

export const meta = {"id": "simulator-balap-kelereng", "name": "Simulator Balap Kelereng", "cat": "fun", "icon": "🔮", "desc": "Kelereng warna-warni balapan menuruni lintasan. Ada tanjakan dan turunan yang mengubah kecepatan tiap kelereng.", "keywords": "balap kelereng,simulator balap,kelereng,marble race,balapan,game,acak", "since": "6.19.0"};

export const NAMA_KELERENG = ['Merah', 'Biru', 'Hijau', 'Kuning', 'Ungu', 'Oranye', 'Putih', 'Hitam'];
export const WARNA_KELERENG = ['#ef4444', '#3b82f6', '#22c55e', '#eab308', '#a855f7', '#f97316', '#f8fafc', '#52525b'];

// Lintasan: daftar segmen [posisiAkhir(%), pengaliKecepatan]. Di tanjakan
// kelereng melambat, di turunan melaju. Arena lurus tanpa segmen.
export const ARENA = {
  lurus: [],
  bergelombang: [[25, 0.6], [45, 1.6], [60, 0.55], [80, 1.7], [100, 1.0]],
  curam: [[30, 0.45], [55, 2.0], [75, 0.5], [100, 1.3]],
};

export function pengaliLintasan(arena, posisi) {
  const seg = ARENA[arena] || [];
  for (const [akhir, kali] of seg) {
    if (posisi < akhir) return kali;
  }
  return 1;
}

export function buatKelereng(jumlah, rand) {
  const r = rand || Math.random;
  const n = Math.max(2, Math.min(8, jumlah | 0 || 4));
  const daftar = [];
  for (let i = 0; i < n; i++) {
    daftar.push({
      nama: NAMA_KELERENG[i],
      warna: WARNA_KELERENG[i],
      x: 0,
      kecepatan: 0.8 + r() * 0.8,
      stamina: 0.7 + r() * 0.6,
      selesai: null,
    });
  }
  return daftar;
}

// Satu langkah. Stamina menurun pelan seiring jarak, jadi kelereng yang
// boros di awal bisa kedodoran di akhir. rand disuntik untuk pengujian.
export function langkahKelereng(kelereng, arena, rand, garisFinis) {
  const r = rand || Math.random;
  for (const k of kelereng) {
    if (k.selesai !== null) continue;
    const kali = pengaliLintasan(arena, k.x);
    const goyang = 0.6 + r() * 0.8;
    const lelah = 1 - (k.x / 100) * (1 - k.stamina) * 0.5;
    k.x += k.kecepatan * kali * goyang * lelah;
    if (k.x >= garisFinis) { k.x = garisFinis; k.selesai = true; }
  }
  return kelereng;
}

export function urutanFinis(kelereng) {
  return [...kelereng].sort((a, b) => {
    if ((a.selesai !== null) !== (b.selesai !== null)) return a.selesai !== null ? -1 : 1;
    return b.x - a.x;
  });
}

export function balapanSelesai(kelereng) {
  return kelereng.every((k) => k.selesai !== null);
}

export function render(root) {
  const st = document.createElement('style');
  st.textContent = '.bk-kanvas{width:100%;height:auto;display:block;background:#171923;border:1px solid rgba(255,255,255,.12);border-radius:12px;margin:12px 0}';
  root.appendChild(st);

  const kanvas = document.createElement('canvas');
  kanvas.className = 'bk-kanvas';
  kanvas.width = 680;
  kanvas.height = 300;
  kanvas.setAttribute('role', 'img');
  kanvas.setAttribute('aria-label', 'Lintasan balap kelereng');
  const ctx = kanvas.getContext('2d');

  const jumlahSel = T.select([['4', '4 kelereng'], ['6', '6 kelereng'], ['8', '8 kelereng']], '6');
  const arenaSel = T.select([['lurus', 'Lintasan lurus'], ['bergelombang', 'Lintasan bergelombang'], ['curam', 'Lintasan curam']], 'bergelombang');
  const box = T.out();
  let kelereng = buatKelereng(6);
  let animId = null;
  let berjalan = false;
  let urutanTiba = [];

  const GARIS = 610;
  const AWAL = 30;

  function gambar() {
    ctx.clearRect(0, 0, kanvas.width, kanvas.height);
    ctx.fillStyle = '#171923';
    ctx.fillRect(0, 0, kanvas.width, kanvas.height);
    const arena = arenaSel.value;
    const seg = ARENA[arena] || [];
    let awalSeg = 0;
    for (const [akhir, kali] of seg) {
      const x0 = AWAL + (awalSeg / 100) * (GARIS - AWAL);
      const x1 = AWAL + (akhir / 100) * (GARIS - AWAL);
      ctx.fillStyle = kali < 1 ? 'rgba(239,68,68,.10)' : 'rgba(34,197,94,.10)';
      ctx.fillRect(x0, 0, x1 - x0, kanvas.height);
      awalSeg = akhir;
    }
    const tinggiLajur = kanvas.height / kelereng.length;
    kelereng.forEach((k, i) => {
      const y = i * tinggiLajur + tinggiLajur / 2;
      ctx.strokeStyle = 'rgba(255,255,255,.08)';
      ctx.beginPath(); ctx.moveTo(0, i * tinggiLajur); ctx.lineTo(kanvas.width, i * tinggiLajur); ctx.stroke();
      const x = AWAL + (k.x / 100) * (GARIS - AWAL);
      const rad = Math.min(11, tinggiLajur / 2 - 4);
      ctx.beginPath();
      ctx.arc(x, y, rad, 0, Math.PI * 2);
      ctx.fillStyle = k.warna;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x - rad * 0.35, y - rad * 0.35, rad * 0.3, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,.75)';
      ctx.fill();
      ctx.fillStyle = '#a1a1aa';
      ctx.font = '11px system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(k.nama, 6, i * tinggiLajur + 13);
    });
    ctx.fillStyle = '#fff';
    for (let y = 0; y < kanvas.height; y += 16) {
      ctx.fillRect(GARIS, y, 8, 8);
      ctx.fillRect(GARIS + 8, y + 8, 8, 8);
    }
  }

  function putar() {
    if (!berjalan) return;
    const sebelum = kelereng.map((k) => k.selesai);
    langkahKelereng(kelereng, arenaSel.value, Math.random, 100);
    kelereng.forEach((k, i) => {
      if (k.selesai !== null && sebelum[i] === null) urutanTiba.push(k.nama);
    });
    gambar();
    if (balapanSelesai(kelereng)) {
      berjalan = false;
      T.show(box, '<p class="big">🏆 Kelereng ' + T.esc(urutanTiba[0] || '') + ' menang!</p>' +
        '<p class="hint">Urutan finis: ' + urutanTiba.map((n, i) => (i + 1) + '. ' + T.esc(n)).join(', ') + '.</p>');
      T.toast('Balapan selesai, kelereng ' + (urutanTiba[0] || '') + ' menang');
      return;
    }
    animId = requestAnimationFrame(putar);
  }

  const aturUlang = () => {
    berjalan = false;
    if (animId) cancelAnimationFrame(animId);
    kelereng = buatKelereng(parseInt(jumlahSel.value, 10));
    urutanTiba = [];
    gambar();
  };
  const mulaiBtn = T.btn('Mulai balap', () => {
    if (berjalan) return;
    aturUlang();
    berjalan = true;
    T.show(box, '<p class="hint">Balapan berjalan. Zona merah memperlambat, zona hijau mempercepat.</p>');
    animId = requestAnimationFrame(putar);
  }, true);
  const ulangBtn = T.btn('Acak ulang kelereng', () => { aturUlang(); T.show(box, '<p class="hint">Kelereng baru sudah siap di garis start.</p>'); });
  jumlahSel.addEventListener('change', aturUlang);
  arenaSel.addEventListener('change', () => { aturUlang(); gambar(); });
  onLeave(() => { berjalan = false; if (animId) cancelAnimationFrame(animId); });

  root.appendChild(T.el('<p class="hint">Tiap kelereng punya kecepatan dan stamina yang diacak tiap balapan. Lintasan bergelombang punya tanjakan yang memperlambat dan turunan yang mempercepat.</p>'));
  root.appendChild(T.field('Jumlah kelereng', jumlahSel));
  root.appendChild(T.field('Lintasan', arenaSel));
  root.appendChild(kanvas);
  root.appendChild(T.row(mulaiBtn, ulangBtn));
  root.appendChild(box);
  gambar();
  T.show(box, '<p class="hint">Tekan "Mulai balap" untuk memulai.</p>');
}
