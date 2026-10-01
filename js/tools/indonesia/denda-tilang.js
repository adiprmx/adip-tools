import { h as T, utils, kv } from '../../core.js?v=6.4.0';

// Denda MAKSIMAL sesuai UU No. 22 Tahun 2009 tentang LLAJ
// (pidana kurungan paling lama X atau denda paling banyak RpY).
const DATA = [
  {
    id: 'helm', label: 'Tidak pakai helm SNI',
    pasal: 'Pasal 291 ayat (1) & (2)', denda: 250000, kurungan: '1 bulan',
    desc: 'Pengendara DAN penumpang motor wajib pakai helm berstandar SNI. Kasih helm ke boncenger juga kewajibanmu.',
  },
  {
    id: 'lawan-arah', label: 'Melawan arah (lawan arus)',
    pasal: 'Pasal 287', denda: 500000, kurungan: '2 bulan',
    desc: 'Termasuk melanggar rambu & marka jalan. Lawan arah itu salah satu penyebab tabrakan adu banteng.',
  },
  {
    id: 'sim', label: 'Tidak bawa / tidak punya SIM',
    pasal: 'Pasal 281', denda: 1000000, kurungan: '4 bulan',
    desc: 'Ini buat yang memang BELUM PUNYA SIM. Kalau SIM-nya ada tapi ketinggalan di rumah (tidak bisa menunjukkan), itu Pasal 288 ayat (2) dengan denda maks Rp250.000.',
  },
  {
    id: 'stnk', label: 'Tidak bawa STNK',
    pasal: 'Pasal 288 ayat (1)', denda: 500000, kurungan: '2 bulan',
    desc: 'Wajib bawa STNK asli saat berkendara. Foto/copy-an belum tentu diterima petugas.',
  },
  {
    id: 'lampu-merah', label: 'Terobos lampu merah',
    pasal: 'Pasal 287 ayat (2)', denda: 500000, kurungan: '2 bulan',
    desc: 'Melanggar alat pemberi isyarat lalu lintas — lampu merah, rambu stop, isyarat petugas.',
  },
  {
    id: 'knalpot', label: 'Knalpot brong / tidak standar',
    pasal: 'Pasal 285 ayat (1)', denda: 250000, kurungan: '1 bulan',
    desc: 'Knalpot termasuk persyaratan teknis & laik jalan. Yang bunyinya bikin kuping tetangga berdengung = kena.',
  },
  {
    id: 'sabuk', label: 'Tidak pakai sabuk pengaman',
    pasal: 'Pasal 289', denda: 250000, kurungan: '1 bulan',
    desc: 'Wajib buat pengemudi dan penumpang yang duduk di samping pengemudi.',
  },
  {
    id: 'hp', label: 'Main HP saat berkendara',
    pasal: 'Pasal 283', denda: 750000, kurungan: '3 bulan',
    desc: 'Melakukan kegiatan lain yang mengganggu konsentrasi — ngetik, nelpon tanpa handsfree, scroll TikTok. Menepi dulu kalau penting.',
  },
];

export const meta = {
  id: 'denda-tilang',
  name: 'Denda Tilang',
  cat: 'indonesia',
  icon: '🚔',
  desc: 'Cek denda maksimal tiap pelanggaran + pasalnya (UU LLAJ No. 22/2009).',
  keywords: 'tilang,denda,polisi,pasal,llaJ,lalu lintas,helm,sim,stnk',
};

export function render(root) {
  const sel = T.select(DATA.map((d) => [d.id, d.label]), 'helm');
  const box = T.out();

  const tampil = () => {
    const d = DATA.find((x) => x.id === sel.value) || DATA[0];
    T.show(box,
      '<div class="big center" style="color:#ef4444">' + T.rp(d.denda) + '</div>' +
      '<p class="center mut">denda MAKSIMAL</p>' +
      kv('Pasal', '<b>' + T.esc(d.pasal) + '</b>') +
      kv('UU', 'No. 22 Tahun 2009 (LLAJ)') +
      kv('Alternatif', 'Kurungan maks ' + T.esc(d.kurungan)) +
      '<p class="hint">' + T.esc(d.desc) + '</p>');
  };

  root.appendChild(T.el('<p class="note">Kena tilang itu bukan akhir dunia — tapi dompet ikut kena. Pilih pelanggarannya, lihat dendanya, dan (mudah-mudahan) nggak diulang.</p>'));
  root.appendChild(T.field('Jenis pelanggaran', sel, 'Angka di bawah adalah BATAS ATAS, bukan harga pasti.'));
  root.appendChild(T.row(T.btn('Lihat Denda', tampil, true)));
  root.appendChild(box);
  root.appendChild(T.el('<p class="hint" style="margin-top:16px">⚠️ Ini cuma ilustrasi. Denda yang beneran kamu bayar ditentukan putusan pengadilan (sidang tilang) — bisa lebih rendah dari angka maksimal di atas.</p>'));
  sel.addEventListener('change', tampil);
  tampil();
}
