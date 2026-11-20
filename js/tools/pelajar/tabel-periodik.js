import { h as T, utils, kv } from '../../core.js';

export const meta = {"id":"tabel-periodik","name":"Tabel Periodik","cat":"pelajar","icon":"⚛️","desc":"118 unsur kimia: ketuk buat lihat detailnya.","keywords":"tabel periodik,unsur,kimia,atom,simbol,massa"};

// [nomor, simbol, nama, massa atom, kategori]
export const UNSUR = [
[1,"H","Hidrogen","1,008","Nonlogam"],[2,"He","Helium","4,003","Gas mulia"],
[3,"Li","Litium","6,94","Logam alkali"],[4,"Be","Berilium","9,012","Alkali tanah"],
[5,"B","Boron","10,81","Metaloid"],[6,"C","Karbon","12,011","Nonlogam"],
[7,"N","Nitrogen","14,007","Nonlogam"],[8,"O","Oksigen","15,999","Nonlogam"],
[9,"F","Fluorin","18,998","Halogen"],[10,"Ne","Neon","20,180","Gas mulia"],
[11,"Na","Natrium","22,990","Logam alkali"],[12,"Mg","Magnesium","24,305","Alkali tanah"],
[13,"Al","Aluminium","26,982","Logam miskin"],[14,"Si","Silikon","28,085","Metaloid"],
[15,"P","Fosfor","30,974","Nonlogam"],[16,"S","Belerang","32,06","Nonlogam"],
[17,"Cl","Klor","35,45","Halogen"],[18,"Ar","Argon","39,948","Gas mulia"],
[19,"K","Kalium","39,098","Logam alkali"],[20,"Ca","Kalsium","40,078","Alkali tanah"],
[21,"Sc","Skandium","44,956","Logam transisi"],[22,"Ti","Titanium","47,867","Logam transisi"],
[23,"V","Vanadium","50,942","Logam transisi"],[24,"Cr","Kromium","51,996","Logam transisi"],
[25,"Mn","Mangan","54,938","Logam transisi"],[26,"Fe","Besi","55,845","Logam transisi"],
[27,"Co","Kobalt","58,933","Logam transisi"],[28,"Ni","Nikel","58,693","Logam transisi"],
[29,"Cu","Tembaga","63,546","Logam transisi"],[30,"Zn","Seng","65,38","Logam transisi"],
[31,"Ga","Galium","69,723","Logam miskin"],[32,"Ge","Germanium","72,63","Metaloid"],
[33,"As","Arsen","74,922","Metaloid"],[34,"Se","Selenium","78,971","Nonlogam"],
[35,"Br","Brom","79,904","Halogen"],[36,"Kr","Kripton","83,798","Gas mulia"],
[37,"Rb","Rubidium","85,468","Logam alkali"],[38,"Sr","Stronsium","87,62","Alkali tanah"],
[39,"Y","Itrium","88,906","Logam transisi"],[40,"Zr","Zirkonium","91,224","Logam transisi"],
[41,"Nb","Niobium","92,906","Logam transisi"],[42,"Mo","Molibdenum","95,95","Logam transisi"],
[43,"Tc","Teknesium","[98]","Logam transisi"],[44,"Ru","Rutenium","101,07","Logam transisi"],
[45,"Rh","Rodium","102,91","Logam transisi"],[46,"Pd","Paladium","106,42","Logam transisi"],
[47,"Ag","Perak","107,87","Logam transisi"],[48,"Cd","Kadmium","112,41","Logam transisi"],
[49,"In","Indium","114,82","Logam miskin"],[50,"Sn","Timah","118,71","Logam miskin"],
[51,"Sb","Antimon","121,76","Metaloid"],[52,"Te","Telurium","127,60","Metaloid"],
[53,"I","Yodium","126,90","Halogen"],[54,"Xe","Xenon","131,29","Gas mulia"],
[55,"Cs","Sesium","132,91","Logam alkali"],[56,"Ba","Barium","137,33","Alkali tanah"],
[57,"La","Lantanum","138,91","Lantanida"],[58,"Ce","Serium","140,12","Lantanida"],
[59,"Pr","Praseodimium","140,91","Lantanida"],[60,"Nd","Neodimium","144,24","Lantanida"],
[61,"Pm","Prometium","[145]","Lantanida"],[62,"Sm","Samarium","150,36","Lantanida"],
[63,"Eu","Europium","151,96","Lantanida"],[64,"Gd","Gadolinium","157,25","Lantanida"],
[65,"Tb","Terbium","158,93","Lantanida"],[66,"Dy","Disprosium","162,50","Lantanida"],
[67,"Ho","Holmium","164,93","Lantanida"],[68,"Er","Erbium","167,26","Lantanida"],
[69,"Tm","Tulium","168,93","Lantanida"],[70,"Yb","Iterbium","173,05","Lantanida"],
[71,"Lu","Lutesium","174,97","Lantanida"],[72,"Hf","Hafnium","178,49","Logam transisi"],
[73,"Ta","Tantalum","180,95","Logam transisi"],[74,"W","Wolfram","183,84","Logam transisi"],
[75,"Re","Renium","186,21","Logam transisi"],[76,"Os","Osmium","190,23","Logam transisi"],
[77,"Ir","Iridium","192,22","Logam transisi"],[78,"Pt","Platina","195,08","Logam transisi"],
[79,"Au","Emas","196,97","Logam transisi"],[80,"Hg","Raksa","200,59","Logam transisi"],
[81,"Tl","Talium","204,38","Logam miskin"],[82,"Pb","Timbal","207,2","Logam miskin"],
[83,"Bi","Bismut","208,98","Logam miskin"],[84,"Po","Polonium","[209]","Metaloid"],
[85,"At","Astatin","[210]","Halogen"],[86,"Rn","Radon","[222]","Gas mulia"],
[87,"Fr","Fransium","[223]","Logam alkali"],[88,"Ra","Radium","[226]","Alkali tanah"],
[89,"Ac","Aktinium","[227]","Aktinida"],[90,"Th","Torium","232,04","Aktinida"],
[91,"Pa","Protaktinium","231,04","Aktinida"],[92,"U","Uranium","238,03","Aktinida"],
[93,"Np","Neptunium","[237]","Aktinida"],[94,"Pu","Plutonium","[244]","Aktinida"],
[95,"Am","Amerisium","[243]","Aktinida"],[96,"Cm","Kurium","[247]","Aktinida"],
[97,"Bk","Berkelium","[247]","Aktinida"],[98,"Cf","Kalifornium","[251]","Aktinida"],
[99,"Es","Einsteinium","[252]","Aktinida"],[100,"Fm","Fermium","[257]","Aktinida"],
[101,"Md","Mendelevium","[258]","Aktinida"],[102,"No","Nobelium","[259]","Aktinida"],
[103,"Lr","Lawrensium","[266]","Aktinida"],[104,"Rf","Ruterfordium","[267]","Logam transisi"],
[105,"Db","Dubnium","[268]","Logam transisi"],[106,"Sg","Seaborgium","[269]","Logam transisi"],
[107,"Bh","Bohrium","[270]","Logam transisi"],[108,"Hs","Hasium","[277]","Logam transisi"],
[109,"Mt","Meitnerium","[278]","Belum diketahui"],[110,"Ds","Darmstadtium","[281]","Belum diketahui"],
[111,"Rg","Roentgenium","[282]","Belum diketahui"],[112,"Cn","Kopernisium","[285]","Logam transisi"],
[113,"Nh","Nihonium","[286]","Belum diketahui"],[114,"Fl","Flerovium","[289]","Belum diketahui"],
[115,"Mc","Moskovium","[290]","Belum diketahui"],[116,"Lv","Livermorium","[293]","Belum diketahui"],
[117,"Ts","Tenesin","[294]","Halogen"],[118,"Og","Oganeson","[294]","Gas mulia"],
];

const WARNA = {
  'Logam alkali': '#ef4444', 'Alkali tanah': '#f59e0b', 'Logam transisi': '#60a5fa',
  'Logam miskin': '#34d399', 'Metaloid': '#2dd4bf', 'Nonlogam': '#a3e635',
  'Halogen': '#eab308', 'Gas mulia': '#a78bfa', 'Lantanida': '#f472b6',
  'Aktinida': '#fb7185', 'Belum diketahui': '#6b7280',
};

// Posisi unsur di tabel periodik: { golongan (1-18, atau null untuk
// deret lantanida/aktinida di luar La/Ac), periode (1-7), blok }.
// La (57) dan Ac (89) duduk di golongan 3; Ce–Lu dan Th–Lr tampil di
// dua baris bawah (konvensi buku sekolah yang umum).
export function posisiUnsur(z) {
  if (!Number.isInteger(z) || z < 1 || z > 118) return null;
  let periode;
  if (z <= 2) periode = 1;
  else if (z <= 10) periode = 2;
  else if (z <= 18) periode = 3;
  else if (z <= 36) periode = 4;
  else if (z <= 54) periode = 5;
  else if (z <= 86) periode = 6;
  else periode = 7;
  let golongan = null, blok = 's';
  if (z === 1) { golongan = 1; blok = 's'; }
  else if (z === 2) { golongan = 18; blok = 's'; }
  else if (periode === 2) {
    if (z <= 4) { golongan = z - 2; blok = 's'; }
    else { golongan = z + 8; blok = 'p'; }
  } else if (periode === 3) {
    if (z <= 12) { golongan = z - 10; blok = 's'; }
    else { golongan = z; blok = 'p'; }
  } else if (periode === 4) {
    if (z <= 20) { golongan = z - 18; blok = 's'; }
    else if (z <= 30) { golongan = z - 18; blok = 'd'; }
    else { golongan = z - 18; blok = 'p'; }
  } else if (periode === 5) {
    if (z <= 38) { golongan = z - 36; blok = 's'; }
    else if (z <= 48) { golongan = z - 36; blok = 'd'; }
    else { golongan = z - 36; blok = 'p'; }
  } else if (periode === 6) {
    if (z <= 56) { golongan = z - 54; blok = 's'; }
    else if (z === 57) { golongan = 3; blok = 'f'; }
    else if (z <= 71) { golongan = null; blok = 'f'; }
    else if (z <= 80) { golongan = z - 68; blok = 'd'; }
    else { golongan = z - 68; blok = 'p'; }
  } else {
    if (z <= 88) { golongan = z - 86; blok = 's'; }
    else if (z === 89) { golongan = 3; blok = 'f'; }
    else if (z <= 103) { golongan = null; blok = 'f'; }
    else if (z <= 112) { golongan = z - 100; blok = 'd'; }
    else { golongan = z - 100; blok = 'p'; }
  }
  return { golongan, periode, blok };
}

// ---------- Konfigurasi elektron ----------
// Urutan pengisian Aufbau (aturan Madelung) + kapasitas tiap subkulit.
const URUTAN_AUFBAU = [
  ['1s', 2], ['2s', 2], ['2p', 6], ['3s', 2], ['3p', 6], ['4s', 2],
  ['3d', 10], ['4p', 6], ['5s', 2], ['4d', 10], ['5p', 6], ['6s', 2],
  ['4f', 14], ['5d', 10], ['6p', 6], ['7s', 2], ['5f', 14], ['6d', 10], ['7p', 6],
];
// Pengecualian konfigurasi dasar yang sudah mapan (20 unsur): subkulit
// setengah/penuh penuh (d⁵, d¹⁰, f⁷) lebih stabil sehingga satu elektron
// pindah dari s ke d/f. Ditulis lengkap agar jumlah elektronnya bisa
// dicek (= nomor atom). Diverifikasi Q5 v6.21.0 (20 Nov 2026) terhadap
// Wikipedia "Electron configurations of the elements (data page)":
// 20/20 pengecualian cocok persis, termasuk Cr, Cu, Nb, Mo, Ru, Rh, Pd,
// Ag, Pt, Au.
const PENGECUALIAN = {
  24: '1s2 2s2 2p6 3s2 3p6 3d5 4s1',
  29: '1s2 2s2 2p6 3s2 3p6 3d10 4s1',
  41: '1s2 2s2 2p6 3s2 3p6 3d10 4s2 4p6 4d4 5s1',
  42: '1s2 2s2 2p6 3s2 3p6 3d10 4s2 4p6 4d5 5s1',
  44: '1s2 2s2 2p6 3s2 3p6 3d10 4s2 4p6 4d7 5s1',
  45: '1s2 2s2 2p6 3s2 3p6 3d10 4s2 4p6 4d8 5s1',
  46: '1s2 2s2 2p6 3s2 3p6 3d10 4s2 4p6 4d10',
  47: '1s2 2s2 2p6 3s2 3p6 3d10 4s2 4p6 4d10 5s1',
  57: '1s2 2s2 2p6 3s2 3p6 3d10 4s2 4p6 4d10 5s2 5p6 5d1 6s2',
  58: '1s2 2s2 2p6 3s2 3p6 3d10 4s2 4p6 4d10 5s2 5p6 4f1 5d1 6s2',
  64: '1s2 2s2 2p6 3s2 3p6 3d10 4s2 4p6 4d10 5s2 5p6 4f7 5d1 6s2',
  78: '1s2 2s2 2p6 3s2 3p6 3d10 4s2 4p6 4d10 4f14 5s2 5p6 5d9 6s1',
  79: '1s2 2s2 2p6 3s2 3p6 3d10 4s2 4p6 4d10 4f14 5s2 5p6 5d10 6s1',
  89: '1s2 2s2 2p6 3s2 3p6 3d10 4s2 4p6 4d10 4f14 5s2 5p6 5d10 6s2 6p6 6d1 7s2',
  90: '1s2 2s2 2p6 3s2 3p6 3d10 4s2 4p6 4d10 4f14 5s2 5p6 5d10 6s2 6p6 6d2 7s2',
  91: '1s2 2s2 2p6 3s2 3p6 3d10 4s2 4p6 4d10 4f14 5s2 5p6 5d10 6s2 6p6 5f2 6d1 7s2',
  92: '1s2 2s2 2p6 3s2 3p6 3d10 4s2 4p6 4d10 4f14 5s2 5p6 5d10 6s2 6p6 5f3 6d1 7s2',
  93: '1s2 2s2 2p6 3s2 3p6 3d10 4s2 4p6 4d10 4f14 5s2 5p6 5d10 6s2 6p6 5f4 6d1 7s2',
  96: '1s2 2s2 2p6 3s2 3p6 3d10 4s2 4p6 4d10 4f14 5s2 5p6 5d10 6s2 6p6 5f7 6d1 7s2',
  103: '1s2 2s2 2p6 3s2 3p6 3d10 4s2 4p6 4d10 4f14 5s2 5p6 5d10 6s2 6p6 5f14 7s2 7p1',
};
const SUPER = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
const sup = (n) => String(n).split('').map((d) => SUPER[d] || d).join('');
const urutOrbital = (a, b) => {
  const na = +a[0], nb = +b[0];
  if (na !== nb) return na - nb;
  return 'spdf'.indexOf(a[1]) - 'spdf'.indexOf(b[1]);
};
function isiAufbau(z) {
  const ok = {};
  let sisa = z;
  for (const [orb, kap] of URUTAN_AUFBAU) {
    if (sisa <= 0) break;
    const isi = Math.min(kap, sisa);
    ok[orb] = isi;
    sisa -= isi;
  }
  return ok;
}
function uraiKonfigurasi(teks) {
  const ok = {};
  String(teks).split(/\s+/).forEach((t) => {
    const m = /^(\d[spdf])(\d+)$/.exec(t);
    if (m) ok[m[1]] = +m[2];
  });
  return ok;
}
// Konfigurasi elektron: { kulit: "2, 8, 14, 2" (per kulit K, L, M, …),
// subkulit: "[Ar] 3d⁶ 4s²" (singkatan gas mulia), penuh: "1s² 2s² …" }.
export function konfigurasiElektron(z) {
  if (!Number.isInteger(z) || z < 1 || z > 118) return null;
  const ok = PENGECUALIAN[z] ? uraiKonfigurasi(PENGECUALIAN[z]) : isiAufbau(z);
  const kulit = [0, 0, 0, 0, 0, 0, 0];
  Object.keys(ok).forEach((o) => { kulit[+o[0] - 1] += ok[o]; });
  while (kulit.length && kulit[kulit.length - 1] === 0) kulit.pop();
  const fmtOrbital = (peta) => Object.keys(peta).sort(urutOrbital)
    .map((o) => o + sup(peta[o])).join(' ');
  const penuh = fmtOrbital(ok);
  // Singkatan gas mulia: kurangi inti gas mulia terbesar di bawah z.
  const GAS = [[86, 'Rn'], [54, 'Xe'], [36, 'Kr'], [18, 'Ar'], [10, 'Ne'], [2, 'He']];
  const gas = GAS.find(([gz]) => z >= gz);
  let subkulit = penuh;
  if (gas) {
    const inti = isiAufbau(gas[0]);
    const sisa = {};
    Object.keys(ok).forEach((o) => {
      const s = ok[o] - (inti[o] || 0);
      if (s > 0) sisa[o] = s;
    });
    const sSisa = fmtOrbital(sisa);
    subkulit = sSisa ? '[' + gas[1] + '] ' + sSisa : '[' + gas[1] + ']';
  }
  return { kulit: kulit.join(', '), subkulit, penuh };
}

export function render(root) {
  const detail = T.out();
  // Tata letak tabel periodik yang benar: 18 kolom golongan, baris 1 =
  // nomor golongan, baris 2–8 = periode 1–7, baris 9 = jeda, baris 10–11
  // = lantanida & aktinida. Lebar minimum + geser horizontal supaya
  // tetap terbaca di HP (tabel periodik memang lebar).
  const gridWrap = T.el('<div style="overflow-x:auto"></div>');
  const grid = T.el('<div style="display:grid;grid-template-columns:repeat(18,minmax(40px,1fr));gap:4px;min-width:700px"></div>');
  gridWrap.appendChild(grid);

  const showDetail = (u) => {
    const w = WARNA[u[4]] || '#888';
    const pos = posisiUnsur(u[0]);
    const konf = konfigurasiElektron(u[0]);
    const golonganTxt = pos.golongan != null ? String(pos.golongan)
      : '– (deret ' + (u[4] === 'Lantanida' ? 'lantanida' : 'aktinida') + ')';
    T.show(detail,
      '<div style="display:flex;align-items:center;gap:12px;margin-bottom:8px">' +
      '<div style="width:56px;height:56px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:20px;background:' + w + '22;border:1px solid ' + w + ';color:#fff">' + T.esc(u[1]) + '</div>' +
      '<div><div class="big" style="margin:0">' + T.esc(u[2]) + '</div>' +
      '<div class="mut" style="font-size:12px">Unsur no. ' + u[0] + ' · ' + T.esc(u[4]) + '</div></div></div>' +
      kv('Simbol', T.esc(u[1])) +
      kv('Massa atom', T.esc(u[3]) + ' <span class="mut">u</span>') +
      kv('Kategori', T.esc(u[4])) +
      kv('Golongan', T.esc(golonganTxt)) +
      kv('Periode', String(pos.periode)) +
      kv('Konfigurasi elektron', T.esc(konf.subkulit)) +
      kv('Elektron per kulit', T.esc(konf.kulit) + ' <span class="mut">(K, L, M, …)</span>'));
    detail.scrollIntoView && detail.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  };

  const buatSel = (u) => {
    const w = WARNA[u[4]] || '#888';
    const pos = posisiUnsur(u[0]);
    const cell = T.el(
      '<button type="button" style="border:1px solid ' + w + '66;background:' + w + '1a;border-radius:8px;padding:6px 2px;color:#fff;cursor:pointer;grid-column:' + (pos.golongan != null ? pos.golongan : (u[0] <= 71 ? u[0] - 57 + 3 : u[0] - 89 + 3)) + ';grid-row:' + (pos.golongan != null ? pos.periode + 1 : (u[0] <= 71 ? 10 : 11)) + '">' +
      '<div style="font-size:9px;opacity:.6">' + u[0] + '</div>' +
      '<div style="font-weight:800;font-size:15px">' + T.esc(u[1]) + '</div>' +
      '<div style="font-size:8.5px;opacity:.7;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + T.esc(u[2]) + '</div>' +
      '</button>');
    cell.addEventListener('click', () => showDetail(u));
    return cell;
  };

  const draw = (filter) => {
    grid.innerHTML = '';
    // Baris nomor golongan 1–18.
    for (let g = 1; g <= 18; g++) {
      grid.appendChild(T.el('<div style="grid-column:' + g + ';grid-row:1;text-align:center;font-size:10px;color:var(--mut);padding:2px 0">' + g + '</div>'));
    }
    // Label dua baris bawah.
    grid.appendChild(T.el('<div style="grid-column:1/-1;grid-row:9;height:10px"></div>'));
    grid.appendChild(T.el('<div style="grid-column:1/4;grid-row:10;display:flex;align-items:center;font-size:10px;color:var(--mut)">Lantanida</div>'));
    grid.appendChild(T.el('<div style="grid-column:1/4;grid-row:11;display:flex;align-items:center;font-size:10px;color:var(--mut)">Aktinida</div>'));
    const q = (filter || '').trim().toLowerCase();
    let cocok = 0;
    UNSUR.forEach((u) => {
      const cell = buatSel(u);
      const kena = !q || u[2].toLowerCase().includes(q) || u[1].toLowerCase() === q;
      if (!kena) cell.style.visibility = 'hidden'; // posisi tetap terjaga
      else cocok++;
      grid.appendChild(cell);
    });
    if (!cocok) {
      grid.appendChild(T.el('<p class="mut" style="grid-column:1/-1;grid-row:12">Nggak ada unsur yang cocok.</p>'));
    }
  };

  const legend = T.el('<div style="display:flex;flex-wrap:wrap;gap:6px;margin:10px 0"></div>');
  Object.keys(WARNA).forEach((k) => {
    legend.appendChild(T.el('<span style="font-size:10.5px;padding:3px 8px;border-radius:20px;border:1px solid ' + WARNA[k] + '66;background:' + WARNA[k] + '1a">' + T.esc(k) + '</span>'));
  });

  const search = T.input('text', '🔍 Cari nama atau simbol, mis. "emas" / "Au"');
  search.addEventListener('input', () => { draw(search.value); });

  root.appendChild(T.el('<p class="hint">118 unsur dalam tata letak tabel periodik: kolom = golongan (1–18), baris = periode (1–7), dua baris bawah = lantanida &amp; aktinida. Ketuk salah satu buat lihat detailnya, termasuk konfigurasi elektron.</p>'));
  root.appendChild(T.field('Cari unsur', search));
  root.appendChild(detail);
  root.appendChild(gridWrap);
  root.appendChild(T.el('<p class="hint">Legenda kategori:</p>'));
  root.appendChild(legend);
  draw('');
  showDetail(UNSUR[7]); // Oksigen sebagai contoh awal
}
