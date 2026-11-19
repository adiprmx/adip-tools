import { h as T } from '../../core.js';

// Checklist Dokumen Travel: daftar dokumen dan persiapan sebelum
// berangkat, dibedakan dalam negeri dan luar negeri. Termasuk cek masa
// berlaku paspor (aturan 6 bulan yang dipakai banyak negara).
// Berbeda dari Checklist Packing (tool sehari-hari): tool ini fokus ke
// dokumen dan persiapan, bukan barang bawaan.
export const meta = {"id": "checklist-dokumen-travel", "name": "Checklist Dokumen Travel", "cat": "travel", "icon": "🛂", "desc": "Daftar dokumen dan persiapan sebelum berangkat, dalam atau luar negeri.", "keywords": "checklist dokumen travel,dokumen perjalanan,paspor,visa,cek paspor,persiapan liburan,dokumen luar negeri", "since": "6.18.0"};

const LS_KEY = 'adip-tools:checklist-dokumen-travel';

export const DAFTAR = {
  dalam: [
    { grup: 'Dokumen wajib', items: ['KTP (asli, bukan fotokopi saja)', 'Tiket / boarding pass', 'Bukti booking hotel atau penginapan'] },
    { grup: 'Uang & pembayaran', items: ['Uang tunai secukupnya', 'Kartu ATM / kartu debit', 'Aplikasi bank sudah bisa dipakai'] },
    { grup: 'Kesehatan & darurat', items: ['Obat pribadi', 'Nomor kontak darurat tersimpan di HP', 'Asuransi perjalanan (bila ada)'] },
    { grup: 'Sebelum berangkat', items: ['HP terisi penuh + charger / power bank', 'Rumah sudah aman ditinggal (kunci, listrik, air)', 'Orang rumah tahu rencana perjalananmu'] },
  ],
  luar: [
    { grup: 'Dokumen wajib', items: ['Paspor (masa berlaku min. 6 bulan sejak tanggal pulang)', 'Visa negara tujuan (bila perlu, cek aturannya)', 'Tiket pesawat pulang-pergi', 'Bukti booking hotel / tempat tinggal', 'Fotokopi paspor + salinan digitalnya (di HP dan email)'] },
    { grup: 'Uang & pembayaran', items: ['Uang tunai mata uang negara tujuan', 'Kartu debit/kredit yang bisa dipakai di luar negeri', 'Beri tahu bank soal rencana ke luar negeri (bila bankmu memintanya)'] },
    { grup: 'Kesehatan & darurat', items: ['Asuransi perjalanan', 'Sertifikat vaksin (bila diminta negara tujuan)', 'Obat pribadi + resep dokter (bila ada)', 'Nomor darurat KBRI / kedutaan di negara tujuan'] },
    { grup: 'Sebelum berangkat', items: ['SIM internasional (bila mau menyetir)', 'Roaming / SIM lokal / eSIM sudah disiapkan', 'Colokan adaptor sesuai negara tujuan', 'Surat izin orang tua (bila bepergian dengan anak di bawah umur tanpa salah satu orang tuanya)'] },
  ],
};

// Cek masa berlaku paspor terhadap tanggal berangkat. Banyak negara
// mensyaratkan paspor masih berlaku minimal 6 bulan. Murni, bisa diuji di Node.
export function cekPaspor(kadaluarsaISO, berangkatISO) {
  const kad = new Date(String(kadaluarsaISO || '') + 'T00:00:00');
  const brk = berangkatISO ? new Date(String(berangkatISO) + 'T00:00:00') : new Date();
  if (isNaN(kad.getTime()) || isNaN(brk.getTime())) return null;
  const sisaHari = Math.floor((kad.getTime() - brk.getTime()) / 86400000);
  const status = sisaHari < 0 ? 'kedaluwarsa' : sisaHari < 180 ? 'mepet' : 'aman';
  return { sisaHari, status };
}

export function render(root) {
  const modeI = T.select([['dalam', 'Dalam negeri'], ['luar', 'Luar negeri']], 'dalam');
  const kadI = T.input('date', '', '');
  const brkI = T.input('date', '', '');
  const pasporBox = T.out();
  const listBox = T.out();
  const progBox = T.out();

  let centang = {};
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) { const d = JSON.parse(raw); if (d && typeof d === 'object') centang = d; }
  } catch (e) { /* abaikan */ }
  const simpan = () => { try { localStorage.setItem(LS_KEY, JSON.stringify(centang)); } catch (e) { /* abaikan */ } };

  const gambar = () => {
    const mode = modeI.value;
    const daftar = DAFTAR[mode];
    let total = 0, selesai = 0;
    daftar.forEach((g) => g.items.forEach((it) => { total++; if (centang[mode + '|' + it]) selesai++; }));
    const persen = total ? Math.round((selesai / total) * 100) : 0;
    T.show(progBox, '<div class="dim" style="margin-bottom:6px">' + selesai + ' dari ' + total + ' selesai (' + persen + '%)</div>' +
      '<div style="height:10px;border-radius:6px;background:rgba(127,127,127,.18);overflow:hidden"><div style="height:100%;width:' + persen + '%;border-radius:6px;background:#4ade80;transition:width .25s"></div></div>');
    T.show(listBox, '');
    daftar.forEach((g) => {
      listBox.appendChild(T.el('<div class="dim" style="margin:12px 0 4px"><b>' + T.esc(g.grup) + '</b></div>'));
      g.items.forEach((it) => {
        const kunci = mode + '|' + it;
        const baris = T.el('<div style="display:flex;align-items:flex-start;gap:8px;padding:7px 0;border-bottom:1px solid rgba(127,127,127,.15)"></div>');
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.checked = !!centang[kunci];
        cb.setAttribute('aria-label', 'Centang: ' + it);
        cb.addEventListener('change', () => { centang[kunci] = cb.checked; simpan(); gambar(); });
        const teks = T.el('<span style="flex:1;word-break:break-word' + (centang[kunci] ? ';text-decoration:line-through;opacity:.6' : '') + '"></span>');
        teks.textContent = it;
        baris.appendChild(cb);
        baris.appendChild(teks);
        listBox.appendChild(baris);
      });
    });
  };

  const cek = () => {
    if (!kadI.value) { T.show(pasporBox, '<div class="err">Isi dulu tanggal kedaluwarsa paspormu.</div>'); return; }
    const r = cekPaspor(kadI.value, brkI.value || null);
    if (!r) { T.show(pasporBox, '<div class="err">Tanggalnya tidak benar. Cek lagi.</div>'); return; }
    if (r.status === 'kedaluwarsa') {
      T.show(pasporBox, '<div class="err">Paspormu sudah kedaluwarsa. Perpanjang dulu sebelum berangkat.</div>');
    } else if (r.status === 'mepet') {
      T.show(pasporBox, '<div class="err">Paspor tinggal berlaku ' + r.sisaHari + ' hari dari tanggal berangkat. Banyak negara menolak paspor yang masa berlakunya kurang dari 6 bulan. Sebaiknya perpanjang dulu.</div>');
    } else {
      T.show(pasporBox, '<p class="info">Paspor masih berlaku ' + r.sisaHari + ' hari dari tanggal berangkat. Melewati patokan 6 bulan yang dipakai banyak negara.</p>');
    }
  };

  modeI.addEventListener('change', gambar);

  root.appendChild(T.el('<p class="note">Fokus tool ini dokumen dan persiapan, bukan barang bawaan. Centanganmu tersimpan di HP ini.</p>'));
  root.appendChild(T.field('Tujuan perjalanan', modeI));
  root.appendChild(T.el('<div class="dim" style="margin:12px 0 4px"><b>Cek masa berlaku paspor</b> (untuk ke luar negeri)</div>'));
  root.appendChild(T.grid2(T.field('Paspor kedaluwarsa', kadI), T.field('Tanggal berangkat (boleh kosong)', brkI, 'Kosong berarti dihitung dari hari ini.')));
  root.appendChild(T.btn('Cek Paspor', cek));
  root.appendChild(pasporBox);
  root.appendChild(progBox);
  root.appendChild(listBox);
  root.appendChild(T.row(T.btn('Ulangi Semua Centangan', () => { centang = {}; simpan(); gambar(); })));
  gambar();
}
