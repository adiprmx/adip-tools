import { h as T } from '../../core.js?v=6.9.20';

export const meta = {"id": "motioncontrol", "name": "Motion Control", "cat": "desain", "icon": "🎥", "desc": "Direktori layanan AI motion & animasi karakter.", "keywords": "motion,animasi,ai,video,karakter,direktori"};

export function render(root) {

  // JSON kurasi lokal — tanpa database/API eksternal.
  const PROVIDERS = [
    {
      name: 'Viggle', category: 'Motion Control', availability: 'available', featured: true,
      description: 'Ubah foto/gambar jadi video bergerak mengikuti video referensi (motion transfer). Populer untuk dance & meme.',
      badges: ['Video', 'Gratis terbatas'], note: 'Butuh akun Viggle (gratis).',
      url: 'https://viggle.ai',
    },
    {
      name: 'Hedra', category: 'Character Animation', availability: 'available', featured: true,
      description: 'Animasi karakter: foto berbicara & bergerak mengikuti audio atau teks yang kamu berikan.',
      badges: ['Talking head', 'Gratis terbatas'],
      url: 'https://www.hedra.com',
    },
    {
      name: 'Runway Act-One', category: 'Motion Control', availability: 'available', featured: false,
      description: 'Transfer ekspresi & gerakan wajah dari video driving ke karakter (bagian dari Runway).',
      badges: ['Pro', 'Berbayar'],
      url: 'https://runwayml.com',
    },
    {
      name: 'DeepMotion', category: 'Motion Control', availability: 'available', featured: false,
      description: 'Motion capture dari video biasa menjadi animasi 3D — tanpa alat khusus.',
      badges: ['3D', 'Gratis terbatas'],
      url: 'https://www.deepmotion.com',
    },
    {
      name: 'Kaiber', category: 'Character Animation', availability: 'available', featured: false,
      description: 'Ubah gambar/teks menjadi video animasi bergaya artistik.',
      badges: ['Video', 'Berbayar'],
      url: 'https://kaiber.ai',
    },
    {
      name: 'Pika', category: 'Character Replace', availability: 'available', featured: false,
      description: 'Edit & ganti elemen di dalam video dengan perintah teks (modify region).',
      badges: ['Video edit', 'Gratis terbatas'],
      url: 'https://pika.art',
    },
    {
      name: 'Luma Dream Machine', category: 'Character Animation', availability: 'available', featured: false,
      description: 'Generasi video dari teks/gambar dengan gerakan kamera sinematik.',
      badges: ['Video', 'Gratis terbatas'],
      url: 'https://lumalabs.ai',
    },
    {
      name: 'Kling AI', category: 'Character Animation', availability: 'busy', featured: false,
      description: 'Text/image-to-video berkualitas tinggi, termasuk mode lip-sync karakter.',
      badges: ['Video', 'Antrean'],
      note: 'Server sering antre saat jam sibuk.',
      url: 'https://klingai.com',
    },
    {
      name: 'HeyGen', category: 'Character Animation', availability: 'available', featured: false,
      description: 'Avatar AI berbicara — cocok untuk video presentasi & konten edukasi.',
      badges: ['Avatar', 'Gratis terbatas'],
      url: 'https://www.heygen.com',
    },
    {
      name: 'D-ID', category: 'Character Animation', availability: 'available', featured: false,
      description: 'Ubah foto statis menjadi video talking-head dengan audio.',
      badges: ['Talking head', 'Gratis terbatas'],
      url: 'https://www.d-id.com',
    },
  ];

  const FILTERS = [
    ['all', 'Semua'],
    ['Motion Control', 'Motion'],
    ['Character Animation', 'Animation'],
    ['Character Replace', 'Replace'],
  ];
  const AVAIL = {
    available: ['Available', '#22c55e'],
    busy: ['Busy', '#eab308'],
    offline: ['Offline', '#ef4444'],
    unknown: ['Status unknown', '#8a8a8a'],
  };

  const validHttps = (v) => {
    try {
      const u = new URL(String(v || ''));
      return u.protocol === 'https:' && !u.username && !u.password ? u.toString() : '';
    } catch (e) { return ''; }
  };

  let activeFilter = 'all';

  const filterBar = T.el('<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px"></div>');
  const grid = T.el('<div style="display:grid;gap:12px"></div>');
  const statusBox = T.el('<div class="dim" style="font-size:13px;margin:8px 0"></div>');

  function card(p) {
    const [aLbl, aCol] = AVAIL[p.availability] || AVAIL.unknown;
    const art = T.el('<article style="border:1px solid #ffffff20;border-radius:12px;padding:14px;background:#141210' + (p.featured ? ';border-color:#e0785680' : '') + '"></article>');
    let h = '';
    if (p.featured) h += '<div style="font-size:12px;font-weight:700;color:#e07856;margin-bottom:6px">RECOMMENDED</div>';
    h += '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px">' +
      '<div><div class="dim" style="font-size:11px;letter-spacing:.08em">' + T.esc(p.category.toUpperCase()) + '</div>' +
      '<h3 style="margin:4px 0 0;font-size:17px">' + T.esc(p.name) + '</h3></div>' +
      '<span style="font-size:12px;font-weight:600;color:' + aCol + ';border:1px solid ' + aCol + '55;border-radius:20px;padding:3px 10px;white-space:nowrap">' + aLbl + '</span></div>' +
      '<p style="font-size:13px;line-height:1.6;color:#c9bda9;margin:10px 0">' + T.esc(p.description) + '</p>' +
      '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px">' +
      (p.badges || []).concat(['EXTERNAL TOOL']).map((b) =>
        '<span style="font-size:11px;border:1px solid #ffffff20;border-radius:6px;padding:3px 8px;color:#c9bda9">' + T.esc(b) + '</span>'
      ).join('') + '</div>';
    if (p.note) h += '<p class="dim" style="font-size:12px;margin:0 0 10px">' + T.esc(p.note) + '</p>';
    const safe = validHttps(p.url);
    if (safe) h += '<a href="' + T.esc(safe) + '" target="_blank" rel="noopener noreferrer" style="display:inline-block;font-size:14px;font-weight:600;color:#e07856;text-decoration:none">Buka Tool ↗</a>';
    art.innerHTML = h;
    return art;
  }

  function draw() {
    const vis = activeFilter === 'all' ? PROVIDERS : PROVIDERS.filter((p) => p.category === activeFilter);
    grid.innerHTML = '';
    vis.forEach((p) => grid.appendChild(card(p)));
    statusBox.textContent = vis.length ? vis.length + ' layanan ditampilkan.' : 'Tidak ada layanan pada filter ini.';
    filterBar.querySelectorAll('button').forEach((b) => b.classList.toggle('primary', b.dataset.f === activeFilter));
  }

  FILTERS.forEach(([v, lbl]) => {
    const b = T.btn(lbl, () => { activeFilter = v; draw(); });
    b.dataset.f = v;
    if (v === 'all') b.classList.add('primary');
    filterBar.appendChild(b);
  });

  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Direktori layanan AI eksternal untuk motion transfer & animasi karakter — daftar kurasi lokal, tanpa database.</p>'));
  root.appendChild(T.el('<div style="border:1px solid #ffffff20;border-radius:10px;padding:10px 12px;font-size:13px;margin-bottom:12px">Proses motion dibuat oleh penyedia eksternal. Adip Tools tidak mengupload, menyimpan, atau memproses gambar/videomu.</div>'));
  root.appendChild(filterBar);
  root.appendChild(statusBox);
  root.appendChild(grid);
  draw();
}
