import { h as T, onLeave } from '../../core.js';

export const meta = { id: 'simulator-tata-surya', name: 'Simulator Tata Surya', cat: 'sains', icon: '🪐', desc: 'Delapan planet mengorbit Matahari dengan kecepatan yang benar. Ketuk planet untuk melihat datanya.', keywords: 'tata surya,planet,orbit,matahari,bumi,mars,jupiter,astronomi,luar angkasa', since: '6.17.0' };

// Data planet dari NASA Planetary Fact Sheet (nilai rata-rata).
// au: jarak rata-rata ke Matahari (1 AU = jarak Bumi-Matahari).
// hari: lama satu putaran mengelilingi Matahari, dalam hari Bumi.
// radiusKm: jari-jari rata-rata. hariPlanet: lama satu putaran pada porosnya.
// bulan: jumlah bulan yang sudah dikonfirmasi (per 2024).
export const PLANET = [
  { nama: 'Merkurius', au: 0.387, hari: 88, radiusKm: 2440, bulan: 0, hariPlanet: '59 hari Bumi', warna: '#b0a89a', fakta: 'Planet paling kecil dan paling dekat ke Matahari. Suhunya siang bisa 430°C, malam turun sampai -180°C.' },
  { nama: 'Venus', au: 0.723, hari: 225, radiusKm: 6052, bulan: 0, hariPlanet: '243 hari Bumi (mundur)', warna: '#e8c97a', fakta: 'Planet terpanas di tata surya (rata-rata 465°C) karena atmosfernya penuh karbon dioksida. Berputar berlawanan arah dengan planet lain.' },
  { nama: 'Bumi', au: 1.0, hari: 365.25, radiusKm: 6371, bulan: 1, hariPlanet: '23,9 jam', warna: '#5b9bd5', fakta: 'Satu-satunya planet yang diketahui punya kehidupan. Sekitar 71% permukaannya tertutup air.' },
  { nama: 'Mars', au: 1.524, hari: 687, radiusKm: 3390, bulan: 2, hariPlanet: '24,6 jam', warna: '#c1440e', fakta: 'Planet merah karena debunya kaya besi berkarat. Punya gunung tertinggi di tata surya: Olympus Mons, 22 km.' },
  { nama: 'Jupiter', au: 5.203, hari: 4333, radiusKm: 69911, bulan: 95, hariPlanet: '9,9 jam', warna: '#d8a878', fakta: 'Planet terbesar. Bintik Merah Besarnya adalah badai yang sudah berputar ratusan tahun dan lebih besar dari Bumi.' },
  { nama: 'Saturnus', au: 9.537, hari: 10759, radiusKm: 58232, bulan: 146, hariPlanet: '10,7 jam', warna: '#e3d4a4', fakta: 'Cincinnya terbuat dari es dan batu. Saturnus sangat ringan: kalau ada bak air raksasa, planet ini akan mengapung.' },
  { nama: 'Uranus', au: 19.19, hari: 30687, radiusKm: 25362, bulan: 28, hariPlanet: '17,2 jam (mundur)', warna: '#8fd1d4', fakta: 'Berputar miring hampir 98 derajat, seperti menggelinding di orbitnya. Warnanya biru kehijauan dari gas metana.' },
  { nama: 'Neptunus', au: 30.07, hari: 60190, radiusKm: 24622, bulan: 16, hariPlanet: '16,1 jam', warna: '#4a6fd4', fakta: 'Planet terjauh dari Matahari. Anginnya paling kencang di tata surya, sampai 2.100 km/jam.' },
];

export function render(root) {
  const st = document.createElement('style');
  st.textContent =
    '.ts-kanvas{width:100%;height:auto;display:block;background:#0d0b09;border:1px solid rgba(255,255,255,.12);border-radius:12px;margin:12px 0;cursor:pointer}' +
    '.ts-kartu{background:var(--deep);border:1px solid var(--line-soft);border-radius:12px;padding:14px;margin-top:12px}' +
    '.ts-kartu h3{margin:0 0 8px;font-size:18px}';
  root.appendChild(st);

  root.appendChild(T.el('<p class="hint">Planet mengorbit dengan kecepatan yang sesuai dengan aslinya: Merkurius paling cepat, Neptunus paling lambat. Ketuk planet mana pun untuk melihat datanya. Ukuran dan jaraknya dibuat tidak sesuai skala supaya semuanya muat di layar.</p>'));

  const kecepatanSel = T.select([
    ['1', 'Normal (1 detik = 10 hari)'],
    ['0.25', 'Pelan (1 detik = 2,5 hari)'],
    ['4', 'Cepat (1 detik = 40 hari)'],
  ], '1');
  const tampilSel = T.select([
    ['nama', 'Tampilkan nama planet'],
    ['tanpa', 'Sembunyikan nama'],
  ], 'nama');

  const kanvas = document.createElement('canvas');
  kanvas.className = 'ts-kanvas';
  kanvas.width = 720;
  kanvas.height = 520;
  kanvas.setAttribute('role', 'img');
  kanvas.setAttribute('aria-label', 'Simulasi tata surya');
  const kartu = T.el('<div class="ts-kartu"><h3>Bumi</h3><div id="ts-isi"></div></div>');

  let berjalan = true;
  let hariSim = 0;
  let pilih = 2; // Bumi
  let animId = null;
  let posisi = []; // [{x, y, r, idx}] untuk deteksi ketuk

  const cx = kanvas.width / 2, cy = kanvas.height / 2;
  const R_MAKS = Math.min(kanvas.width, kanvas.height) / 2 - 30;
  // Jarak orbit di layar: akar pangkat dari AU supaya planet luar tidak terlalu jauh.
  const orbitR = (au) => 34 + (Math.sqrt(au) / Math.sqrt(30.07)) * (R_MAKS - 34);
  const planetR = (radiusKm) => 4 + Math.log10(radiusKm / 2440) * 6;

  function gambar() {
    const ctx = kanvas.getContext('2d');
    const W = kanvas.width, H = kanvas.height;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0d0b09';
    ctx.fillRect(0, 0, W, H);
    // Bintang latar
    ctx.fillStyle = 'rgba(255,255,255,.45)';
    for (let i = 0; i < 90; i++) {
      const x = (i * 97 + 31) % W, y = (i * 57 + 13) % H;
      ctx.fillRect(x, y, 1.4, 1.4);
    }
    // Matahari
    const g = ctx.createRadialGradient(cx - 6, cy - 6, 2, cx, cy, 22);
    g.addColorStop(0, '#fff3b0');
    g.addColorStop(0.6, '#ffb703');
    g.addColorStop(1, '#fb8500');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e8ded0';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Matahari', cx, cy + 34);

    posisi = [];
    PLANET.forEach((p, idx) => {
      const r = orbitR(p.au);
      // Orbit
      ctx.strokeStyle = 'rgba(255,255,255,.14)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
      // Sudut: mulai acak per planet supaya tidak sejajar, lalu maju sesuai hari.
      const sudut = idx * 0.9 + (hariSim / p.hari) * Math.PI * 2;
      const x = cx + Math.cos(sudut) * r;
      const y = cy + Math.sin(sudut) * r;
      const pr = planetR(p.radiusKm);
      ctx.fillStyle = p.warna;
      ctx.beginPath();
      ctx.arc(x, y, pr, 0, Math.PI * 2);
      ctx.fill();
      if (idx === 5) {
        // Cincin Saturnus
        ctx.strokeStyle = 'rgba(227,212,164,.8)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(x, y, pr * 1.9, pr * 0.6, -0.4, 0, Math.PI * 2);
        ctx.stroke();
      }
      if (idx === pilih) {
        ctx.strokeStyle = '#ff6f61';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, pr + 5, 0, Math.PI * 2);
        ctx.stroke();
      }
      if (tampilSel.value === 'nama') {
        ctx.fillStyle = '#e8ded0';
        ctx.font = '11px sans-serif';
        ctx.fillText(p.nama, x, y - pr - 6);
      }
      posisi.push({ x, y, r: Math.max(pr + 6, 12), idx });
    });
    // Keterangan waktu
    ctx.fillStyle = '#a89c88';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'left';
    const tahun = Math.floor(hariSim / 365.25);
    const sisa = Math.floor(hariSim % 365.25);
    ctx.fillText('Waktu simulasi: ' + tahun + ' tahun ' + sisa + ' hari', 12, 20);
  }

  function tampilKartu() {
    const p = PLANET[pilih];
    kartu.querySelector('h3').textContent = p.nama;
    kartu.querySelector('#ts-isi').innerHTML =
      '<p style="margin:0 0 8px;line-height:1.6">' + T.esc(p.fakta) + '</p>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:13px">' +
      '<div>Jarak ke Matahari: <b>' + String(p.au).replace('.', ',') + ' AU</b></div>' +
      '<div>Satu tahun: <b>' + T.fmt(p.hari) + ' hari</b></div>' +
      '<div>Jari-jari: <b>' + T.fmt(p.radiusKm) + ' km</b></div>' +
      '<div>Satu hari: <b>' + T.esc(p.hariPlanet) + '</b></div>' +
      '<div>Jumlah bulan: <b>' + p.bulan + '</b></div>' +
      '<div>1 AU = 149,6 juta km</div>' +
      '</div>';
  }

  let terakhir = performance.now();
  const putar = (now) => {
    const dt = Math.min(0.1, (now - terakhir) / 1000);
    terakhir = now;
    if (berjalan) {
      const laju = parseFloat(kecepatanSel.value);
      hariSim += dt * 10 * laju;
      gambar();
    }
    animId = requestAnimationFrame(putar);
  };

  kanvas.addEventListener('click', (e) => {
    const rect = kanvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * kanvas.width / rect.width;
    const y = (e.clientY - rect.top) * kanvas.height / rect.height;
    let terbaik = null, jarakTerbaik = 1e9;
    posisi.forEach((p) => {
      const d = Math.hypot(p.x - x, p.y - y);
      if (d < p.r + 8 && d < jarakTerbaik) { jarakTerbaik = d; terbaik = p.idx; }
    });
    if (terbaik != null) {
      pilih = terbaik;
      tampilKartu();
      gambar();
    }
  });

  const btnJeda = T.btn('Jeda', () => {
    berjalan = !berjalan;
    btnJeda.textContent = berjalan ? 'Jeda' : 'Lanjutkan';
  });
  const btnReset = T.btn('Ulang dari awal', () => { hariSim = 0; gambar(); });

  onLeave(() => { if (animId) cancelAnimationFrame(animId); });

  root.append(
    T.grid2(T.field('Kecepatan waktu', kecepatanSel), T.field('Nama planet', tampilSel)),
    T.row(btnJeda, btnReset),
    kanvas,
    kartu,
    T.el('<p class="hint" style="margin-top:10px">Data: NASA Planetary Fact Sheet. Jumlah bulan per 2024. Ukuran planet dan jarak orbit dibuat tidak sesuai skala aslinya supaya enak dilihat.</p>'),
  );
  tampilKartu();
  gambar();
  animId = requestAnimationFrame(putar);
}
