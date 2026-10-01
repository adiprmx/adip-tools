import { h as T, utils } from '../../core.js?v=6.7.0';

export const meta = {"id":"generator-nama-grup","name":"Nama Grup","cat":"fun","icon":"😂","desc":"66 nama grup WA lucu: keluarga, teman, kerja. Acak & salin.","keywords":"nama grup,whatsapp,grup wa,lucu,keluarga,teman,kerja,acak"};

const NAMA = [
  // ---- Keluarga (22) ----
  { n: 'Keluarga Cemara (Banyak Drama)', c: 'keluarga' },
  { n: 'Rukun Selalu (Amin)', c: 'keluarga' },
  { n: 'Kartu Keluarga Digital', c: 'keluarga' },
  { n: 'Grup Warisan', c: 'keluarga' },
  { n: 'Arisan Doa Ibu', c: 'keluarga' },
  { n: 'Keluarga Harmonis v2.0', c: 'keluarga' },
  { n: 'Siapa Cuci Piring Hari Ini?', c: 'keluarga' },
  { n: 'Mama Papa & Anak Zaman Now', c: 'keluarga' },
  { n: 'Kumpul Keluarga (Jarang Kumpul)', c: 'keluarga' },
  { n: 'Traktir Mama Hari Ini?', c: 'keluarga' },
  { n: 'Grup Lebaran', c: 'keluarga' },
  { n: 'Kabar dari Kampung Halaman', c: 'keluarga' },
  { n: 'Cucu Kesayangan Nenek', c: 'keluarga' },
  { n: 'Reuni Keluarga (Wacana)', c: 'keluarga' },
  { n: 'Keluarga Anti Drama (Bohong)', c: 'keluarga' },
  { n: 'Makan Bareng Kapan?', c: 'keluarga' },
  { n: 'Anak Rantau Merindu', c: 'keluarga' },
  { n: 'Doa Ibu Panjang Umur', c: 'keluarga' },
  { n: 'Keluarga Sakinah Mawaddah', c: 'keluarga' },
  { n: 'Rapat Keluarga Penting', c: 'keluarga' },
  { n: 'Silsilah Keluarga Besar', c: 'keluarga' },
  { n: 'Rumah Penuh Cinta', c: 'keluarga' },
  // ---- Teman (22) ----
  { n: 'Sobat Misqueen', c: 'teman' },
  { n: 'Teman Tapi Mesra', c: 'teman' },
  { n: 'Geng Tongkrongan', c: 'teman' },
  { n: 'Squad Nongkrong Anti Bubar', c: 'teman' },
  { n: 'Teman Seperjuangan (Utang)', c: 'teman' },
  { n: 'Grup Wacana Liburan', c: 'teman' },
  { n: 'Anak Nongkrong Official', c: 'teman' },
  { n: 'Teman Lama Bersemi Kembali', c: 'teman' },
  { n: 'Geng Motor (Jalan Kaki)', c: 'teman' },
  { n: 'Sahabat Sampai Tua', c: 'teman' },
  { n: 'Teman Curhat 24/7', c: 'teman' },
  { n: 'Squad Begadang', c: 'teman' },
  { n: 'Geng Mabar', c: 'teman' },
  { n: 'Sobat Ambyar', c: 'teman' },
  { n: 'Grup Gosip Terpercaya', c: 'teman' },
  { n: 'Sahabat Sejati (Kadang)', c: 'teman' },
  { n: 'Geng Kumpul (Wacana Terus)', c: 'teman' },
  { n: 'Teman Seperjuangan Skripsi', c: 'teman' },
  { n: 'Squad Rebahan', c: 'teman' },
  { n: 'Teman Makan Gratis', c: 'teman' },
  { n: 'Geng Alumni', c: 'teman' },
  { n: 'Bestie Forever', c: 'teman' },
  // ---- Kerja (22) ----
  { n: 'Tim Lembur Nasional', c: 'kerja' },
  { n: 'Rapat Dadakan', c: 'kerja' },
  { n: 'Grup Kerja: Deadline Mepet', c: 'kerja' },
  { n: 'Tim Produktivitas (Katanya)', c: 'kerja' },
  { n: 'Karyawan Teladan', c: 'kerja' },
  { n: 'Meeting Tanpa Akhir', c: 'kerja' },
  { n: 'Tim Weekend Warrior', c: 'kerja' },
  { n: 'Grup Kantor: Gosip Halal', c: 'kerja' },
  { n: 'Deadline Hunter', c: 'kerja' },
  { n: 'Tim Kerja Rodi', c: 'kerja' },
  { n: 'Kantor Rasa Keluarga (Drama)', c: 'kerja' },
  { n: 'Project X: Rahasia', c: 'kerja' },
  { n: 'Tim Overtime Club', c: 'kerja' },
  { n: 'Grup Atasan Baik Hati', c: 'kerja' },
  { n: 'Karyawan Rajin (Online)', c: 'kerja' },
  { n: 'Tim Target Tercapai', c: 'kerja' },
  { n: 'Rapat Koordinasi Koordinasi', c: 'kerja' },
  { n: 'Grup Kerja Santai Tapi Selesai', c: 'kerja' },
  { n: 'Tim Monday Blues', c: 'kerja' },
  { n: 'Kantor Anti Baper', c: 'kerja' },
  { n: 'Shift Malam Squad', c: 'kerja' },
  { n: 'Tim Gajian', c: 'kerja' },
];

const CAT_LABEL = { keluarga: '👨‍👩‍👧 Keluarga', teman: '🧑‍🤝‍🧑 Teman', kerja: '💼 Kerja' };

export function render(root) {
  const box = T.out();
  const catSel = T.select([['semua', '🎲 Semua kategori'], ['keluarga', '👨‍👩‍👧 Keluarga'], ['teman', '🧑‍🤝‍🧑 Teman'], ['kerja', '💼 Kerja']], 'semua');
  let cur = null;

  const acak = () => {
    const pool = catSel.value === 'semua' ? NAMA : NAMA.filter((x) => x.c === catSel.value);
    let pick = pool[Math.floor(Math.random() * pool.length)];
    if (pool.length > 1) {
      let guard = 0;
      while (pick === cur && guard++ < 10) pick = pool[Math.floor(Math.random() * pool.length)];
    }
    cur = pick;
    T.show(box,
      '<p class="hint">' + CAT_LABEL[cur.c] + '</p>' +
      '<div class="big center" style="font-size:24px;line-height:1.4">“' + T.esc(cur.n) + '”</div>'
    );
  };

  root.appendChild(T.el('<p class="hint">Bingung kasih nama grup WA? Pencet aja, biar nasib yang milih. 😆</p>'));
  root.appendChild(T.field('Kategori', catSel));
  root.appendChild(box);
  root.appendChild(T.row(
    T.btn('🎲 Acak nama', acak, true),
    T.copyBtn(() => (cur ? '“' + cur.n + '”' : ''), '📋 Salin')
  ));
  acak();
}
