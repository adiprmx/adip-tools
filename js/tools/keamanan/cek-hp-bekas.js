import { h as T } from '../../core.js?v=6.12.0';

const CEK_HP = [
  { grup: 'Fisik dan layar', item: [
    ['Bodi dan frame', 'Periksa retak, penyok, dan bekas kena air di slot SIM dan port charger.'],
    ['Layar sentuh', 'Geser jari ke seluruh layar, pastikan tidak ada bagian yang tidak merespons.'],
    ['Layar dan warna', 'Buka gambar putih polos, cari bercak, garis, atau burn-in (bayangan aplikasi lama).'],
    ['Tombol dan port', 'Coba semua tombol, port charger, dan lubang headset bila ada.']
  ] },
  { grup: 'Baterai dan performa', item: [
    ['Kesehatan baterai', 'Cek di pengaturan. Di bawah 80 persen berarti baterai sudah lemah dan perlu ganti.'],
    ['HP cepat panas', 'Pakai 10 menit untuk video atau game ringan. Panas berlebih bisa tanda baterai atau mesin bermasalah.'],
    ['Performa', 'Buka beberapa aplikasi bergantian. Lemot parah bisa berarti memori hampir penuh atau mesin sudah tua.']
  ] },
  { grup: 'Sinyal dan koneksi', item: [
    ['Kartu SIM dan sinyal', 'Pasang SIM-mu sendiri, coba telepon, SMS, dan internet.'],
    ['WiFi dan Bluetooth', 'Sambungkan ke WiFi dan perangkat Bluetooth, pastikan stabil.'],
    ['GPS', 'Buka aplikasi peta, pastikan lokasi akurat.']
  ] },
  { grup: 'Kamera dan suara', item: [
    ['Kamera depan dan belakang', 'Foto di tempat terang dan gelap, cek fokus, flash, dan hasil videonya.'],
    ['Speaker dan mikrofon', 'Putar musik dan rekam suara, pastikan jernih di kedua sisi.'],
    ['Sensor sidik jari dan wajah', 'Daftarkan jarimu dan coba buka kunci beberapa kali.']
  ] },
  { grup: 'Keaslian dan keamanan', item: [
    ['IMEI terdaftar', 'Cek IMEI di situs resmi Kemenperin (tautan di bawah). IMEI tidak terdaftar berarti HP tidak resmi masuk Indonesia.'],
    ['Akun lama sudah keluar', 'Pastikan akun Google/Apple penjual sudah keluar dan kunci FRP/Activation Lock tidak aktif.'],
    ['Reset pabrik', 'Minta penjual reset pabrik di depanmu, lalu atur dari awal seperti HP baru.'],
    ['Kelengkapan dan garansi', 'Tanya dus, charger asli, dan sisa garansi resmi bila masih ada.']
  ] }
];

export const meta = {"id": "cek-hp-bekas", "name": "Cek HP Bekas", "cat": "keamanan", "icon": "📱", "desc": "Checklist lengkap sebelum membeli HP second.", "keywords": "hp bekas,second,cek hp,beli hp,imei,bekas,used phone", "since": "6.11.0"};

export function render(root) {
  const KUNCI = 'at-cek-hp-bekas';
  let centang = {};
  try { centang = JSON.parse(localStorage.getItem(KUNCI) || '{}'); } catch (e) { centang = {}; }
  const total = CEK_HP.reduce((a, g) => a + g.item.length, 0);
  const progres = T.el('<div style="font-size:14px;margin:12px 0"></div>');
  const wadah = T.el('<div></div>');

  function simpan() {
    try { localStorage.setItem(KUNCI, JSON.stringify(centang)); } catch (e) { /* abaikan */ }
  }
  function perbaruiProgres() {
    const sudah = Object.values(centang).filter(Boolean).length;
    progres.innerHTML = sudah === total
      ? `<b style="color:#4ade80">Semua ${total} pemeriksaan selesai. Semoga HP-nya awet.</b>`
      : `Pemeriksaan selesai: <b>${sudah} dari ${total}</b>`;
  }

  CEK_HP.forEach((g, gi) => {
    wadah.appendChild(T.el(`<h3 style="margin-top:20px">${g.grup}</h3>`));
    g.item.forEach((it, ii) => {
      const kunci = gi + '-' + ii;
      const cek = document.createElement('input');
      cek.type = 'checkbox';
      cek.checked = !!centang[kunci];
      cek.style.cssText = 'width:20px;height:20px;flex-shrink:0;margin-top:2px';
      cek.addEventListener('change', () => { centang[kunci] = cek.checked; simpan(); perbaruiProgres(); });
      const label = T.el('<label style="display:flex;gap:10px;align-items:flex-start;font-size:14px;line-height:1.5;cursor:pointer;margin-bottom:12px"></label>');
      label.appendChild(cek);
      const teks = T.el('<span></span>');
      teks.innerHTML = '<b>' + it[0] + '</b><br><span style="color:#a1a1aa">' + it[1] + '</span>';
      label.appendChild(teks);
      wadah.appendChild(label);
    });
  });

  root.appendChild(T.el('<p class="note">Jangan buru-buru saat cek HP bekas. Lewati satu per satu daftar di bawah, centang yang sudah diperiksa. Hasil centang tersimpan di HP ini.</p>'));
  root.appendChild(progres);
  root.appendChild(T.el('<p style="font-size:14px"><a href="https://imei.kemenperin.go.id/" target="_blank" rel="noopener">Cek IMEI di situs resmi Kemenperin</a> (buka di tab baru, masukkan nomor IMEI HP-nya)</p>'));
  root.appendChild(wadah);
  root.appendChild(T.btn('Ulangi dari awal', () => {
    centang = {};
    simpan();
    wadah.querySelectorAll('input[type="checkbox"]').forEach((c) => { c.checked = false; });
    perbaruiProgres();
  }));
  perbaruiProgres();
}
