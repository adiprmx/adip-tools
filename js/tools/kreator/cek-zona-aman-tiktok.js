import { h as T, fileInput } from '../../core.js';

// Cek Zona Aman TikTok: unggah gambar atau tangkapan layar videomu,
// lalu lihat bagian mana saja yang tertutup tombol dan keterangan TikTok.
// Zona di bawah ini panduan umum dari ukuran layar 9:16 yang dipakai
// banyak kreator; tampilan TikTok bisa berubah sewaktu-waktu, jadi
// anggap ini patokan, bukan ukuran resmi.
export const meta = {"id": "cek-zona-aman-tiktok", "name": "Cek Zona Aman TikTok", "cat": "kreator", "icon": "📱", "desc": "Lihat bagian video yang tertutup tombol dan keterangan TikTok sebelum diunggah.", "keywords": "zona aman tiktok,safe zone tiktok,overlay tiktok,ukuran tiktok,preview tiktok,9:16", "since": "6.18.0"};

// Zona dalam persen dari lebar/tinggi layar 9:16 (0-100).
// Atas: bar navigasi. Kanan: tombol like, komen, bagikan, simpan.
// Bawah: keterangan, nama akun, tombol musik.
export const ZONA_AMAN = [
  { id: 'atas', label: 'Bar atas (navigasi)', x0: 0, x1: 100, y0: 0, y1: 9 },
  { id: 'kanan', label: 'Tombol di kanan (like, komen, bagikan)', x0: 84, x1: 100, y0: 38, y1: 80 },
  { id: 'bawah', label: 'Keterangan & nama akun', x0: 0, x1: 100, y0: 80, y1: 100 },
];

// Zona mana yang menutupi titik (x%, y%)? Null bila aman.
// Murni, bisa diuji di Node.
export function zonaDiTitik(x, y) {
  const px = Number(x), py = Number(y);
  if (!isFinite(px) || !isFinite(py)) return null;
  for (const z of ZONA_AMAN) {
    if (px >= z.x0 && px <= z.x1 && py >= z.y0 && py <= z.y1) return z.id;
  }
  return null;
}

export function render(root) {
  const fi = fileInput('image/*');
  const frameBox = T.out();
  const hasilBox = T.out();
  const cek = { atas: true, kanan: true, bawah: true };
  let imgUrl = '';

  const gambar = () => {
    const zonaHtml = ZONA_AMAN.filter((z) => cek[z.id]).map((z) =>
      '<div style="position:absolute;left:' + z.x0 + '%;top:' + z.y0 + '%;width:' + (z.x1 - z.x0) + '%;height:' + (z.y1 - z.y0) + '%;background:rgba(255,60,60,.35);border:1px dashed rgba(255,120,120,.9);box-sizing:border-box;display:flex;align-items:center;justify-content:center;text-align:center;padding:4px"><span style="font-size:10px;color:#fff;text-shadow:0 1px 2px rgba(0,0,0,.8)">' + T.esc(z.label) + '</span></div>').join('');
    const isi = imgUrl
      ? '<img src="' + T.esc(imgUrl) + '" alt="Pratinjau videomu" style="width:100%;height:100%;object-fit:cover;display:block">'
      : '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#1c1a17"><span class="dim" style="padding:16px;text-align:center">Belum ada gambar.<br>Unggah tangkapan layar videomu di atas, atau pakai bingkai kosong ini.</span></div>';
    T.show(frameBox, '<div style="max-width:300px;margin:0 auto"><div id="tiktok-frame" style="position:relative;width:100%;aspect-ratio:9/16;background:#1c1a17;border-radius:12px;overflow:hidden;cursor:crosshair">' + isi + zonaHtml + '</div>' +
      '<p class="hint center">Ketuk di mana saja pada bingkai untuk mengecek apakah titik itu aman.</p></div>');
    const frame = frameBox.querySelector('#tiktok-frame');
    if (frame) {
      frame.addEventListener('click', (e) => {
        const r = frame.getBoundingClientRect();
        const x = ((e.clientX - r.left) / r.width) * 100;
        const y = ((e.clientY - r.top) / r.height) * 100;
        const zona = zonaDiTitik(x, y);
        if (zona) {
          const z = ZONA_AMAN.find((zz) => zz.id === zona);
          T.show(hasilBox, '<div class="err">Titik ini tertutup: ' + T.esc(z.label) + '. Jangan letakkan teks atau wajah penting di sini.</div>');
        } else {
          T.show(hasilBox, '<p class="info">Titik ini aman, tidak tertutup tombol atau keterangan TikTok.</p>');
        }
      });
    }
  };

  fi.addEventListener('change', () => {
    const f = fi.files && fi.files[0];
    if (!f) { imgUrl = ''; gambar(); return; }
    if (typeof FileReader === 'undefined') { T.toast('Peramban ini tidak bisa membaca gambar'); return; }
    const r = new FileReader();
    r.onload = () => { imgUrl = String(r.result || ''); gambar(); };
    r.readAsDataURL(f);
  });

  const tombolZona = ZONA_AMAN.map((z) => {
    const b = T.btn(z.label, () => { cek[z.id] = !cek[z.id]; gambar(); });
    return b;
  });

  root.appendChild(T.el('<p class="note">Zona merah adalah area yang tertutup tampilan TikTok. Ini panduan umum dari ukuran layar 9:16, bukan ukuran resmi TikTok, karena tampilannya bisa berubah.</p>'));
  root.appendChild(T.field('Unggah gambar / tangkapan layar (boleh kosong)', fi, 'Gambar hanya dipakai di halaman ini, tidak diunggah ke mana-mana.'));
  root.appendChild(T.el('<div class="dim" style="margin:8px 0 4px">Tampilkan / sembunyikan zona</div>'));
  root.appendChild(T.row(...tombolZona));
  root.appendChild(frameBox);
  root.appendChild(hasilBox);
  gambar();
}
