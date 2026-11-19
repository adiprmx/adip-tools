import { h as T, utils } from '../../core.js';

export const meta = {"id": "simpul-tali", "name": "Simpul Tali", "cat": "pelajar", "icon": "🪢", "desc": "Belajar 8 simpul tali dengan diagram langkah demi langkah: nama, cara, dan kegunaannya.", "keywords": "simpul tali,tali,pramuka,ikatan,bowline,prusik,clove hitch", "since": "6.19.0"};

// Diagram skema (bukan skala): garis tebal = tali utama, garis koral = ujung
// yang sedang dikerjakan, abu-abu = tiang/cincin. Setiap langkah: {p: [[d,
// warna]], c: keterangan}.
export const SIMPUL = [
  {
    id: 'mati', nama: 'Simpul Mati', alias: 'Reef knot', sulit: 1,
    guna: 'Menyambung dua tali yang sama besar, dan mengikat perban.',
    langkah: [
      { p: [['M30,30 Q100,60 170,90', '#e8e0d0'], ['M30,90 Q100,60 170,30', '#ff7a66']], c: 'Silangkan kedua ujung tali. Ujung kiri di atas ujung kanan.' },
      { p: [['M40,90 C40,35 160,35 160,90', '#e8e0d0'], ['M40,90 C70,112 130,112 160,90', '#ff7a66'], ['M70,42 L130,78', '#ff7a66']], c: 'Lingkarkan ujung yang di atas ke bawah ujung satunya, lalu tarik. Ini satu ikatan biasa.' },
      { p: [['M60,45 h80 a15,15 0 0 1 0,30 h-80 a15,15 0 0 1 0,-30', '#e8e0d0'], ['M85,20 v80 a15,15 0 0 1 30,0 v-80 a15,15 0 0 1 -30,0', '#ff7a66'], ['M30,60 L60,60', '#e8e0d0'], ['M140,60 L170,60', '#ff7a66']], c: 'Ulangi sekali lagi ke arah berlawanan, lalu tarik keempat ujungnya.' },
    ],
  },
  {
    id: 'hidup', nama: 'Simpul Hidup', alias: 'Slip knot', sulit: 1,
    guna: 'Jerat yang bisa dikencangkan dan dilepas dengan satu tarikan.',
    langkah: [
      { p: [['M100,32 a26,26 0 1 1 -0.1,0', '#e8e0d0'], ['M100,58 L100,110', '#e8e0d0'], ['M126,32 L170,32', '#ff7a66']], c: 'Buat lingkaran di tali. Ujung bebasnya di depan lingkaran.' },
      { p: [['M100,32 a26,26 0 1 1 -0.1,0', '#e8e0d0'], ['M100,58 C84,72 84,92 100,98 C116,92 116,72 100,58', '#ff7a66'], ['M100,98 L152,110', '#ff7a66']], c: 'Ambil lipatan tali dari belakang lingkaran, tarik lewat tengahnya.' },
      { p: [['M100,32 a26,26 0 1 1 -0.1,0', '#e8e0d0'], ['M100,58 L100,98', '#ff7a66'], ['M100,98 L164,52', '#ff7a66']], c: 'Tarik ujung bebas untuk mengencangkan. Tarik ujung satunya untuk melepas.' },
    ],
  },
  {
    id: 'anyam', nama: 'Simpul Anyam', alias: 'Sheet bend', sulit: 2,
    guna: 'Menyambung dua tali yang beda ukuran atau beda bahan.',
    langkah: [
      { p: [['M40,25 C40,95 160,95 160,25', '#e8e0d0']], c: 'Lipat tali yang lebih tebal jadi bentuk U.' },
      { p: [['M40,25 C40,95 160,95 160,25', '#e8e0d0'], ['M78,112 L78,48 Q100,32 122,48 L122,112', '#ff7a66']], c: 'Ujung tali tipis masuk dari bawah, melingkari belakang U, lalu selipkan di bawah dirinya sendiri.' },
      { p: [['M40,25 C40,95 160,95 160,25', '#e8e0d0'], ['M78,112 L78,48 Q100,32 122,48 L122,80 L100,66', '#ff7a66']], c: 'Tarik kedua tali sampai kencang. Simpul anyam kuat untuk tali beda ukuran.' },
    ],
  },
  {
    id: 'pangkal', nama: 'Simpul Pangkal', alias: 'Clove hitch', sulit: 1,
    guna: 'Mengikat tali ke tiang, tongkat, atau pipa.',
    langkah: [
      { p: [['M92,8 L92,112', '#8a7f6d'], ['M108,8 L108,112', '#8a7f6d'], ['M30,45 L70,45', '#e8e0d0'], ['M70,45 a30,12 0 1 1 60,0', '#e8e0d0']], c: 'Lilitkan tali sekali mengelilingi tiang.' },
      { p: [['M92,8 L92,112', '#8a7f6d'], ['M108,8 L108,112', '#8a7f6d'], ['M70,45 a30,12 0 1 1 60,0', '#e8e0d0'], ['M70,45 L130,78', '#ff7a66'], ['M70,78 a30,12 0 1 1 60,0', '#ff7a66']], c: 'Silangkan tali di atas lilitan pertama, lalu lilit sekali lagi di bawahnya.' },
      { p: [['M92,8 L92,112', '#8a7f6d'], ['M108,8 L108,112', '#8a7f6d'], ['M70,45 a30,12 0 1 1 60,0', '#e8e0d0'], ['M70,78 a30,12 0 1 1 60,0', '#ff7a66'], ['M130,78 L112,92', '#ff7a66']], c: 'Selipkan ujungnya di bawah lilitan kedua, lalu tarik kencang.' },
    ],
  },
  {
    id: 'jangkar', nama: 'Simpul Jangkar', alias: 'Anchor bend', sulit: 2,
    guna: 'Mengikat tali ke cincin, jangkar, atau gelang besi.',
    langkah: [
      { p: [['M100,36 a18,18 0 1 1 -0.1,0', '#8a7f6d'], ['M55,112 C55,55 75,28 100,28 C125,28 145,55 145,112', '#e8e0d0'], ['M70,112 C70,65 85,44 100,44 C115,44 130,65 130,112', '#e8e0d0']], c: 'Lingkarkan tali dua kali melewati cincin.' },
      { p: [['M100,36 a18,18 0 1 1 -0.1,0', '#8a7f6d'], ['M55,112 C55,55 75,28 100,28 C125,28 145,55 145,112', '#e8e0d0'], ['M70,112 C70,65 85,44 100,44 C115,44 130,65 130,112', '#e8e0d0'], ['M130,112 C130,88 112,82 96,82', '#ff7a66']], c: 'Lingkarkan ujungnya mengelilingi tali utama.' },
      { p: [['M100,36 a18,18 0 1 1 -0.1,0', '#8a7f6d'], ['M55,112 C55,55 75,28 100,28 C125,28 145,55 145,112', '#e8e0d0'], ['M70,112 C70,65 85,44 100,44 C115,44 130,65 130,112', '#e8e0d0'], ['M96,82 a9,9 0 1 1 -0.1,0', '#ff7a66'], ['M96,91 L96,112', '#ff7a66']], c: 'Kunci dengan satu ikatan setengah di tali utama.' },
    ],
  },
  {
    id: 'kursi', nama: 'Simpul Kursi', alias: 'Bowline', sulit: 2,
    guna: 'Membuat lingkaran yang tidak mengencang di ujung tali, untuk menolong orang atau mengikat ke tiang.',
    langkah: [
      { p: [['M100,40 a15,15 0 1 1 -0.1,0', '#e8e0d0'], ['M100,55 L100,112', '#e8e0d0'], ['M115,40 L168,40', '#ff7a66']], c: 'Buat lingkaran kecil di tali. Ujung bebasnya di depan lingkaran.' },
      { p: [['M100,40 a15,15 0 1 1 -0.1,0', '#e8e0d0'], ['M100,55 L100,112', '#e8e0d0'], ['M168,40 L115,40', '#ff7a66'], ['M115,40 C100,58 84,68 84,88', '#ff7a66']], c: 'Ujung naik lewat lingkaran, lalu memutar ke belakang tali utama.' },
      { p: [['M100,40 a15,15 0 1 1 -0.1,0', '#e8e0d0'], ['M100,55 L100,112', '#e8e0d0'], ['M84,88 C84,64 100,52 115,40', '#ff7a66'], ['M115,40 L168,40', '#ff7a66'], ['M84,88 L40,112', '#ff7a66']], c: 'Ujung turun lagi lewat lingkaran yang sama, lalu tarik. Lingkaran besarnya tidak akan mengencang.' },
    ],
  },
  {
    id: 'nelayan', nama: 'Simpul Nelayan', alias: "Fisherman's knot", sulit: 1,
    guna: 'Menyambung dua tali, terutama tali pancing yang licin.',
    langkah: [
      { p: [['M20,45 L180,45', '#e8e0d0'], ['M20,75 L180,75', '#ff7a66'], ['M70,45 a11,11 0 1 1 -0.1,0', '#e8e0d0']], c: 'Sejajarkan dua tali berlawanan arah. Buat ikatan biasa di ujung tali pertama, mengelilingi tali kedua.' },
      { p: [['M20,45 L180,45', '#e8e0d0'], ['M20,75 L180,75', '#ff7a66'], ['M70,45 a11,11 0 1 1 -0.1,0', '#e8e0d0'], ['M130,75 a11,11 0 1 1 -0.1,0', '#ff7a66']], c: 'Buat ikatan biasa yang sama di ujung tali kedua.' },
      { p: [['M20,45 L180,45', '#e8e0d0'], ['M20,75 L180,75', '#ff7a66'], ['M88,45 a11,11 0 1 1 -0.1,0', '#e8e0d0'], ['M112,75 a11,11 0 1 1 -0.1,0', '#ff7a66']], c: 'Geser kedua ikatan sampai bertemu di tengah, lalu tarik kedua tali.' },
    ],
  },
  {
    id: 'prusik', nama: 'Simpul Prusik', alias: 'Prusik knot', sulit: 3,
    guna: 'Simpul geser untuk memanjat tali atau menahan beban. Meluncur saat longgar, mencengkeram saat dibebani.',
    langkah: [
      { p: [['M100,8 L100,112', '#e8e0d0'], ['M65,60 a35,13 0 1 1 70,0', '#ff7a66']], c: 'Lingkarkan tali prusik (seutas tali melingkar) mengelilingi tali utama.' },
      { p: [['M100,8 L100,112', '#e8e0d0'], ['M65,52 a35,13 0 1 1 70,0', '#ff7a66'], ['M65,78 a35,13 0 1 1 70,0', '#ff7a66'], ['M135,52 C152,62 152,82 135,90', '#ff7a66']], c: 'Masukkan ujung lingkaran prusik lewat dirinya sendiri, dua kali.' },
      { p: [['M100,8 L100,112', '#e8e0d0'], ['M65,50 a35,12 0 1 1 70,0', '#ff7a66'], ['M65,70 a35,12 0 1 1 70,0', '#ff7a66'], ['M65,90 a35,12 0 1 1 70,0', '#ff7a66']], c: 'Rapikan lilitannya sampai sejajar. Simpul siap dipakai.' },
    ],
  },
];

function svgLangkah(lang, no) {
  let isi = '';
  lang.p.forEach(([d, warna]) => {
    isi += '<path d="' + d + '" fill="none" stroke="' + warna + '" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>';
  });
  return '<div style="border:1px solid rgba(255,255,255,.15);border-radius:10px;padding:8px;margin-bottom:10px">' +
    '<div style="display:flex;gap:6px;align-items:center;margin-bottom:4px"><span style="display:inline-flex;width:22px;height:22px;border-radius:50%;background:#fff;color:#111;align-items:center;justify-content:center;font-size:12px;font-weight:700">' + no + '</span>' +
    '<span style="font-size:13px;line-height:1.5">' + T.esc(lang.c) + '</span></div>' +
    '<svg width="100%" viewBox="0 0 200 120" style="display:block;background:#12100d;border-radius:8px" role="img" aria-label="Diagram langkah ' + no + '">' + isi + '</svg></div>';
}

export function render(root) {
  const pilih = T.select(SIMPUL.map((s) => [s.id, s.nama + ' (' + s.alias + ')']), 'mati');
  const box = T.out();

  const tampil = () => {
    const s = SIMPUL.find((x) => x.id === pilih.value) || SIMPUL[0];
    const bintang = '★'.repeat(s.sulit) + '☆'.repeat(3 - s.sulit);
    let h = '<div class="big" style="font-size:22px">' + T.esc(s.nama) + '</div>';
    h += '<p class="dim">' + T.esc(s.alias) + ' · Tingkat kesulitan ' + bintang + '</p>';
    h += '<p><b>Kegunaan:</b> ' + T.esc(s.guna) + '</p>';
    h += '<p class="hint">Diagram di bawah ini skema sederhana. Garis tebal krem tali utama, garis koral ujung yang sedang dikerjakan.</p>';
    s.langkah.forEach((lang, i) => { h += svgLangkah(lang, i + 1); });
    if (s.id === 'prusik' || s.id === 'kursi') {
      h += '<p class="err">Untuk panjat atau menahan beban orang, simpul ini harus dilatih dengan pendamping yang sudah berpengalaman. Jangan dipakai untuk keselamatan sebelum benar-benar dikuasai.</p>';
    }
    T.show(box, h);
  };

  pilih.addEventListener('change', tampil);

  root.appendChild(T.el('<p class="note">' + SIMPUL.length + ' simpul yang paling sering dipakai di pramuka, berkemah, dan memancing. Pilih simpulnya, ikuti diagram langkahnya.</p>'));
  root.appendChild(T.grid2(T.field('Pilih simpul', pilih)));
  root.appendChild(box);
  tampil();
}
